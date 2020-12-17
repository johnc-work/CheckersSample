import { Component, OnInit } from '@angular/core';
import { Token } from './token.model';
@Component({
  selector: 'app-checkers',
  templateUrl: './checkers.component.html',
  styleUrls: ['./checkers.component.css']
})
export class CheckersComponent implements OnInit {
  boardWidth = 8;
  boardHeight = 8;
  RowsOfPieces = 3;
  board = [];
  pieceKey = ["Empty", "Red", "Black", "Invalid"];
  emptySpace = 0;
  player1piece = 1;
  player2piece = 2;
  invalidSpace = 3;
  selected = null;
  currentTurn = 1;
  playerTookAPiece = false;
  winState = false;
  statusMessage = "Player 1 turn.";

  public playerClick(width, height) {
    var space = this.board[height][width];
    console.log('winstate', this.winState);
    if (!this.winState) {
      if (this.selected === null) {
        console.log('no selection');
        if (this.currentTurn === space.state) {//selected token matches current player
          this.selected = space;
          console.log('select');
          this.selectToken();
        }
      }
      else {
        console.log('make move');

        if (this.selected.hpos === height && //if token is clicked twice unselect
          this.selected.wpos === width) {
          console.log('alternate');
          this.selected = null;
          if (this.playerTookAPiece) {
            this.emptyPossibleFlags();
            this.alternateTurn();
          }
          this.playerTookAPiece = false;
        }
        else {
          console.log('execute move');
          this.executeMove(height, width);   //else execute the move
        }
      }
    }
  }

  public alternateTurn() {
    this.selected = null;
    this.emptyPossibleFlags();
    this.currentTurn = this.currentTurn === this.player1piece ? this.player2piece : this.player1piece;
    this.statusMessage = this.pieceKey[this.currentTurn] + " Player turn.";
  }

  public selectToken() {
    //highlight possible moves
    var space = this.selected;
    this.emptyPossibleFlags();
    if (space.state === this.player1piece || space.king) { //red pieces move down
        this.markSpacePossible(space, 1, -1);
        this.markSpacePossible(space, 1, 1);
    }
    if (space.state === this.player2piece || space.king){
        this.markSpacePossible(space,-1, -1);
        this.markSpacePossible(space, -1, 1);
    }
  }

  public markSpacePossible(space, hoffset, woffset) {
    var enemy = space.state === this.player1piece ? this.player2piece: this.player1piece;
    var adjacentSpaceH = space.hpos + hoffset;
    var adjacentSpaceW = space.wpos + woffset;
    var nextSpaceH = space.hpos + hoffset * 2;
    var nextSpaceW = space.wpos + woffset * 2;
    if (this.getSpaceState(adjacentSpaceH, adjacentSpaceW) === this.invalidSpace) {
      return;
    }
    var moveTo = this.board[adjacentSpaceH][adjacentSpaceW];
    if (moveTo.state === enemy && this.getSpaceState(nextSpaceH, nextSpaceW) === this.emptySpace) { //if this is an enemy space
      moveTo = this.board[nextSpaceH][nextSpaceW];
      moveTo.possible = true;
      this.board[moveTo.hpos][moveTo.wpos] = moveTo;
    }
    if (moveTo.state === this.emptySpace) { //can't move into your own person
      moveTo.possible = true;
      this.board[moveTo.hpos][moveTo.wpos] = moveTo;
    }
  }

  public getSpaceState(height, width) {
    if (height >= this.boardHeight || width >= this.boardWidth
      || height < 0 || width < 0) {
      return this.invalidSpace;
    }
    var space = this.board[height][width];
    return space.state;
  }

  public executeMove(height, width) {
    //if the same spot is highlight
    var moveTo = this.board[height][width];
    if (moveTo.possible) {
      //set up the tokens
      var moveFrom = this.selected;
      this.playerTookAPiece = Math.abs(moveTo.wpos - moveFrom.wpos) > 1; //if we've moved two spaces we can assume we're moving over a piece
      moveTo.state = moveFrom.state;
      moveTo.king = moveFrom.king;
      moveFrom.state = this.emptySpace;
      moveFrom.king = false;

      if (this.playerTookAPiece) { //if we're moving over an enemy, remove it
        var enemyW = moveFrom.wpos + (moveTo.wpos - moveFrom.wpos) / 2;
        var enemyH = moveFrom.hpos + (moveTo.hpos - moveFrom.hpos) / 2;
        var enemy = this.board[enemyH][enemyW];
        enemy.state = this.emptySpace;
        this.board[enemyH][enemyW] = enemy;
      }
      //execute move
      this.board[moveTo.hpos][moveTo.wpos] = moveTo;
      this.board[moveFrom.hpos][moveFrom.wpos] = moveFrom;

      //remove possible move flags
      this.emptyPossibleFlags();

      //clear selected or set up combos
      this.selected = moveTo;
      if (!this.playerTookAPiece || !this.selectMultipleJumpMoves()) { //if we didn't take a piece or can't make a follow up
        this.alternateTurn(); 
      }

      //advance token to king
      this.advanceTokenToKing(moveTo);
      //determine win state
      this.winState = this.setWinState(moveTo.state);
      
    }
  }
  public advanceTokenToKing(space) {
    if (!space.king &&
       ((space.state === this.player1piece && this.boardHeight - 1 === space.hpos) ||
        (space.state === this.player2piece && 0 === space.hpos))
    ){
      space.king = true;
      this.board[space.hpos][space.wpos] = space;
    }

  }

  public setWinState(playerFlag) {
    var enemyToken = playerFlag === this.player1piece ? this.player2piece : this.player1piece;
    for (var height = 0; height < this.boardHeight; height++) {
      for (var width = 0; width < this.boardWidth; width++) {
        if (this.board[height][width].state == enemyToken) {
          console.log("game is not won");
          return false;
        }
      }
    }
    console.log("game is won");
    this.statusMessage = "Player " + playerFlag + " won!";
    return true;
  }
  public emptyPossibleFlags() {
    for (var h = 0; h < this.boardHeight; h++) {
      for (var w = 0; w < this.boardWidth; w++) {
        var space = this.board[h][w];
        space.possible = false;
        this.board[h][w] = space;
      }
    }
  }

  public selectMultipleJumpMoves() {
    var movePossible = false;
    //highlight possible jump moves
    var space = this.selected;
    if (space.state === this.player1piece || space.king) { //top pieces move down
      movePossible = movePossible || this.markJumpMovePossible(space, 1, -1);
      movePossible = movePossible || this.markJumpMovePossible(space, 1, 1);
    }
    else if (space.state === this.player2piece || space.king) {
      movePossible = movePossible || this.markJumpMovePossible(space, -1, -1);
      movePossible = movePossible || this.markJumpMovePossible(space, -1, 1);
    }
    return movePossible;
  }

  public markJumpMovePossible(space, hoffset, woffset) {
    var enemyToken = space.state === this.player1piece ? 2 : 1;
    var adjacentH = space.hpos + hoffset;
    var adjacentW = space.wpos + woffset;
    var nextH = space.hpos + hoffset * 2;
    var nextW = space.wpos + woffset * 2;
    if (this.getSpaceState(adjacentH, adjacentW) !== enemyToken ||
        this.getSpaceState(nextH, nextW) !== this.emptySpace) {
      return false;
    }
    var enemyspace = this.board[adjacentH][adjacentW];

    if (enemyspace.state === enemyToken) {
      var moveTo = this.board[nextH][nextW];
      if (moveTo.state === this.emptySpace) {
        moveTo.possible = true;
        this.board[nextH][nextW] = moveTo;
        return true;
      }
    }
    return false;
  }




  public initializeBoard() {
    var newBoard = [];
    for (var height = 0; height < this.boardHeight; height++) {
      var row = [];
      for (var width = 0; width < this.boardWidth; width++) {
        let rowOffset = height % 2;
        var pieceToPlace = this.emptySpace;

        if (width % 2 !== rowOffset) {
          pieceToPlace = this.invalidSpace;
        }
        else if (height < this.RowsOfPieces) {
          pieceToPlace = this.player1piece;
        }
        else if (height >= this.boardHeight - this.RowsOfPieces ) {
          pieceToPlace = this.player2piece;
        }
        var space = new Token()
        space.state = pieceToPlace;
        space.hpos = height;
        space.wpos = width;
        row[width] = space;
      }
      newBoard[height] =  row;
    }
    this.board = newBoard;
    this.winState = false;
  }

  public ngOnInit() {
    this.initializeBoard();
  }
}
