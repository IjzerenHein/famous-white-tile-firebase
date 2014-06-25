/* 
 * Copyright (c) 2014 Gloey Apps
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2014
 */

/*jslint browser:true, nomen:true, vars:true, plusplus:true*/
/*global define*/

define(function (require, exports, module) {
    'use strict';

    // import dependencies
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var View = require('famous/core/View');
    
    var StateModifier = require('famous/modifiers/StateModifier');
    var Easing = require('famous/transitions/Easing');
    var Transitionable = require('famous/transitions/Transitionable');
    var GridLayout = require('famous/views/GridLayout');
    var RenderController = require('famous/views/RenderController');

    /**
     * AppView
     * @class AppView
     * @extends View
     * @constructor
     * @param {Object} [options] Configuration options
     */
    function AppView(options) {
        View.apply(this, arguments);
        
        // Init
        this.transitionable = new Transitionable(0);
        this.modifier = new StateModifier();
        this.renderable = this.add(this.modifier);
        
        // Create rows
        this._createRows();
        this._createCounter();
        this._createEndScreen();
        
        // Reset
        this.reset();
    }
    AppView.prototype = Object.create(View.prototype);
    AppView.prototype.constructor = AppView;

    AppView.DEFAULT_OPTIONS = {
        rows: 4,
        cells: 4,
        godMode: false // basically, you never die when you enable this ;)
    };
    
    /**
     * @method _createRows
     */
    AppView.prototype._createRows = function () {
        this.rows = [];
        var i, j;
        for (i = 0; i <= this.options.rows; i++) {
            var row = {
                modifier: new Modifier({
                    size: [undefined, undefined]
                }),
                grid: new GridLayout({
                    dimensions: [this.options.cells, 1]
                }),
                cells: [],
                blackTile: -1,
                clickedTile: -1
            };
            var renderables = [];
            for (j = 0; j < this.options.cells; j++) {
                var cell = {
                    modifier: new StateModifier({
                        size: [undefined, undefined]
                    }),
                    surface: new Surface({
                        classes: ['cell']
                    })
                };
                cell.renderable = new RenderNode(cell.modifier);
                cell.renderable.add(cell.surface);
                cell.surface.on('mousedown', this._onClickCell.bind(this, i, j));
                cell.surface.on('touchstart', this._onClickCell.bind(this, i, j));
                row.cells.push(cell);
                renderables.push(cell.renderable);
            }
            row.grid.sequenceFrom(renderables);
            this.renderable.add(row.modifier).add(row.grid);
            this.rows.push(row);
        }
    };
    
    /**
     * @method _createCounter
     */
    AppView.prototype._createCounter = function () {
        this.counter = {
            score: 0,
            modifier: new Modifier({
                size: [70, 65],
                origin: [0.5, 0],
                align: [0.5, 0],
                transform: Transform.translate(0, 10, 0)
            }),
            surface: new Surface({
                classes: ['counter']
            })
        };
        this.renderable.add(this.counter.modifier).add(this.counter.surface);
    };
    
    /**
     * @method _createEndScreen
     */
    AppView.prototype._createEndScreen = function () {
        this.end = {
            renderController: new RenderController(),
            modifier: new Modifier(),
            backSurface: new Surface({
                classes: ['end']
            }),
            restartModifier: new Modifier({
                size: [undefined, 60],
                align: [0.5, 0.5],
                origin: [0.5, 0.5]
            }),
            restartSurface: new Surface({
                classes: ['end-button', 'restart'],
                content: 'Restart'
            }),
            scoreModifier: new Modifier({
                size: [undefined, 200],
                align: [0.5, 0.3],
                origin: [0.5, 0.3]
            }),
            scoreSurface: new Surface({
                classes: ['end-button', 'score'],
                content: 'Score'
            }),
            footerModifier: new Modifier({
                size: [undefined, 30],
                align: [1.0, 1.0],
                origin: [1.0, 1.0]
            }),
            footerSurface: new Surface({
                classes: ['end-button', 'footer'],
                content: '© 2014 - IjzerenHein'
            })
        };
        this.end.renderable = new RenderNode(this.end.modifier);
        this.end.renderable.add(this.end.backSurface);
        this.end.renderable.add(this.end.restartModifier).add(this.end.restartSurface);
        this.end.restartSurface.on('click', this.restart.bind(this));
        this.end.renderable.add(this.end.scoreModifier).add(this.end.scoreSurface);
        this.end.renderable.add(this.end.footerModifier).add(this.end.footerSurface);
        this.renderable.add(this.end.renderController);
    };
    
    /**
     * @method reset
     */
    AppView.prototype.reset = function () {
        var i, j;
        
        // Reset state
        this.transitionable.reset(0);
        this._isRunning = false;
        this._isStopped = false;
        
        // Reset rows
        for (i = 0; i < this.rows.length; i++) {
            var row = this.rows[i];
            row.blackTile = -1;
            row.clickedTile = -1;
            for (j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                cell.surface.setClasses(['cell']);
            }
        }
        
        // Generate start tiles
        this.blackTiles = [{black: -2, clicked: -1}]; // first line is yellow
        for (i = 0; i < 10; i++) {
            this._getTile(i);
        }
    
        // Set 'start' in first black tile
        this.rows[1].cells[this._getTile(1).black].surface.setContent('<div>Start</div>');
        
        // Reset counter
        this.counter.score = 0;
        this.counter.surface.setContent('<div>' + this.counter.score + '</div>');
    
        // Show playing field
        this.modifier.setTransform(Transform.translate(0, -window.innerHeight, 0));
        this.modifier.setTransform(
            Transform.translate(0, 0, 0),
            {duration: 300, curve: Easing.outBack}
        );
    };
    
    /**
     * @method restart
     */
    AppView.prototype.restart = function () {
        this.end.renderController.hide();
        this.reset();
    };
    
    /**
     * @method showEnd
     */
    AppView.prototype.showEnd = function () {
        this.end.scoreSurface.setContent(this.counter.score);
        this.end.renderController.show(this.end.renderable);
    };
    
    /**
     * @method _getTile
     */
    AppView.prototype._getTile = function (index) {
        var i;
        for (i = this.blackTiles.length; i <= index; i++) {
            var tile = {
                black: Math.floor(Math.random() * this.options.cells),
                clicked: -1
            };
            this.blackTiles.push(tile);
        }
        return this.blackTiles[index];
    };
    
    /**
     * @method _onClickCell
     */
    AppView.prototype._onClickCell = function (rowIndex, cellIndex, event) {
        
        event.preventDefault();
        
        // Ignore cell-clicks when stopped
        if (this._isStopped) {
            return;
        }
        
        // Get the clicked tile
        var offset = Math.floor(this.transitionable.get());
        var add = this.rows.length - (rowIndex + 1);
        var tileIndex = (offset + (this.rows.length - ((offset + add) % this.rows.length))) - 1;
        var tile = this._getTile(tileIndex);

        // Wait for player to click 'start'
        if (!this._isRunning) {
            
            // When not running, start when the start-tile is clicked
            if ((tileIndex === 1) && (cellIndex === this._getTile(tileIndex).black)) {
                tile.clicked = cellIndex;
                this.rows[rowIndex].cells[this._getTile(tileIndex).black].surface.setContent('');
                this.start();
                
                // Increase counter
                this.counter.score += 1;
                this.counter.surface.setContent('<div>' + this.counter.score + '</div>');
            }
            return;
        }
                
        // Stop the game when a white cell was pressed
        if (!this.options.godMode && (tile.black !== cellIndex)) {
            this.stop();
            var cell = this.rows[rowIndex].cells[cellIndex];
            cell.surface.addClass('fault');
            var blink = {duration: 200};
            var i;
            for (i = 0; i < 5; i++) {
                cell.modifier.setOpacity(0, blink);
                cell.modifier.setOpacity(1, blink);
            }
            cell.modifier.setOpacity(0, blink);
            cell.modifier.setOpacity(1, blink, this.showEnd.bind(this));
            return;
        }
        
        // Ingore clicks on black-tiles if the previous tile is not already black
        var prevTile = this._getTile(tileIndex - 1);
        if (!this.options.godMode && (prevTile.clicked < 0)) {
            return;
        }
        
        // Store click
        tile.clicked = cellIndex;
        
        // Increase counter
        this.counter.score += 1;
        this.counter.surface.setContent('<div>' + this.counter.score + '</div>');
    };
        
    /**
     * @method start
     */
    AppView.prototype.start = function () {
        this.state = {
            count: 0,
            increment: 10,
            duration: 5000
        };
        this.transitionable.set(
            this.state.count + this.state.increment,
            {duration: this.state.duration},
            this.speedup.bind(this)
        );
        this._isRunning = true;
    };
    
    /**
     * @method speedup
     */
    AppView.prototype.speedup = function () {
        this.state.count += this.state.increment;
        this.state.duration = this.state.duration * 0.9;
        this.transitionable.set(
            this.state.count + this.state.increment,
            {duration: this.state.duration},
            this.speedup.bind(this)
        );
    };
    
    /**
     * @method stop
     */
    AppView.prototype.stop = function () {
        this.transitionable.halt();
        this._isRunning = false;
        this._isStopped = true;
    };

    /**
     * Renders the view.
     *
     * @method render
     * @private
     * @ignore
     */
    AppView.prototype.render = function render() {
                
        // Calculate stuff
        var rowHeight = window.innerHeight / this.options.rows;
        var i, j, y = 0;
        var rawOffset = this.transitionable.get();
        var offset = Math.floor(rawOffset);
        var start = offset % this.rows.length;

        // Determine offset of bottom row
        var fraction = (rawOffset % 1) * rowHeight;
        y = ((window.innerHeight + fraction) - rowHeight);
        
        // Update rows
        for (i = 0; i < this.rows.length; i++) {
            var rowIndex = (i + start) % this.rows.length;
            var row = this.rows[rowIndex];
                        
            // Set tile-color
            var tile = this._getTile(offset + i);
            if (row.blackTile !== tile.black) {
                if (row.blackTile >= 0) {
                    row.cells[row.blackTile].surface.removeClass('black');
                } else if (row.blackTile === -2) {
                    for (j = 0; j < row.cells.length; j++) {
                        row.cells[j].surface.removeClass('yellow');
                    }
                }
                if (tile.black === -2) {
                    for (j = 0; j < row.cells.length; j++) {
                        row.cells[j].surface.addClass('yellow');
                    }
                } else if (tile.black !== -1) {
                    row.cells[tile.black].surface.addClass('black');
                }
                row.blackTile = tile.black;
            }
            
            // Set clicked color
            if (row.clickedTile !== tile.clicked) {
                if (row.clickedTile >= 0) {
                    row.cells[row.clickedTile].surface.removeClass('clicked');
                }
                if (tile.clicked >= 0) {
                    row.cells[tile.clicked].surface.addClass('clicked');
                }
                row.clickedTile = tile.clicked;
            }
            
            // Positions the row
            row.modifier.sizeFrom([undefined, rowHeight]);
            row.modifier.transformFrom(
                Transform.translate(0, y, 0)
            );
            y -= rowHeight;
        }
        
        // Check if the player missed the tile
        if (this._isRunning && !this.options.godMode && (offset > 1)) {
            var prevTile = this._getTile(offset - 1);
            if (prevTile.clicked < 0) {
                this.stop();
                this.transitionable.set(
                    offset - 2,
                    { duration: 500, curve: Easing.outBack }
                );
                var cell = this.rows[(offset - 1) % this.rows.length].cells[prevTile.black];
                cell.surface.addClass('missed');
                var blink = {duration: 200};
                for (i = 0; i < 5; i++) {
                    cell.modifier.setOpacity(0, blink);
                    cell.modifier.setOpacity(1, blink);
                }
                cell.modifier.setOpacity(0, blink);
                cell.modifier.setOpacity(1, blink, this.showEnd.bind(this));
            }
        }
        
        // Call super
        return this._node.render();
    };
        
    module.exports = AppView;
});
