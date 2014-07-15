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

/*global define*/

define(function(require, exports, module) {
    'use strict';

    // import dependencies
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var View = require('famous/core/View');
    var InputSurface = require('famous/surfaces/InputSurface');

    var StateModifier = require('famous/modifiers/StateModifier');
    var Easing = require('famous/transitions/Easing');
    var Transitionable = require('famous/transitions/Transitionable');
    var GridLayout = require('famous/views/GridLayout');
    var RenderController = require('famous/views/RenderController');
    var ScrollContainer = require('famous/views/ScrollContainer');
    var FlexibleLayout = require('famous/views/FlexibleLayout');

    var BoxLayout = require('famous-boxlayout');
    var SizeModifier = require('famous-sizemodifier');

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
    AppView.prototype._createRows = function() {
        this.rows = [];
        for (var i = 0; i <= this.options.rows; i++) {
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
            for (var j = 0; j < this.options.cells; j++) {
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
    AppView.prototype._createCounter = function() {
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
     *
     */
    AppView.prototype._createEndScreen = function() {
        this.end = {
            renderController: new RenderController()
        }
        var modifier = new Modifier({
            align: [0.5, 0.5],
            origin: [0.5, 0.5],
        });
        var sizeModifier = new SizeModifier({
            max: [500, undefined]
        });
        var flexibleLayout = new FlexibleLayout({
            ratios: [true, true, true, true, true, 1, true, true, true],
            direction: 1
        });
        flexibleLayout.sequenceFrom([
            this._createNewScore(),
            this._createUsername(),
            new RenderNode(new Modifier({size: [undefined, 20]})),
            this._createYourHighscore(),
            new RenderNode(new Modifier({size: [undefined, 10]})),
            this._createHighscores(),
            new RenderNode(new Modifier({size: [undefined, 10]})),
            this._createRestartButton(),
            this._createFooter()
        ]);
        this.end.renderable = new RenderNode();
        this.end.renderable.add(new Surface({
            classes: ['end']
        }));
        var boxLayout = new BoxLayout({ margins: [0, 20]});
        boxLayout.middle.add(flexibleLayout);
        this.end.renderable.add(modifier).add(sizeModifier).add(boxLayout);
        this.renderable.add(this.end.renderController);
    }

    /**
     *
     */
    AppView.prototype._createYourHighscore = function() {
        var modifier = new Modifier({
            size: [undefined, 30]
        });
        var renderable = new RenderNode(modifier);
        var boxLayout = new BoxLayout({
            margins: [0, 100, 0, 0]
        });
        boxLayout.middle.add(new Surface({
            content: 'Your highscore:',
            classes: ['end-button', 'highscore']
        }));
        this.yourScoreSurface = new Surface({
            content: '',
            classes: ['end-button', 'highscore'],
            properties: {
                textAlign: 'right'
            }
        });
        boxLayout.right.add(this.yourScoreSurface);
        renderable.add(boxLayout);
        return renderable;
    }
        
    /**
     *
     */
    AppView.prototype._createHighscore = function(highscore, index) {
        var modifier = new Modifier({
            size: [undefined, 30]
        });
        var renderable = new RenderNode(modifier);
        var boxLayout = new BoxLayout({
            margins: [0, 100, 0, 40]
        });
        boxLayout.left.add(new Surface({
            content: index + '.',
            classes: ['end-button', 'highscore']
        }));
        boxLayout.middle.add(new Surface({
            content: highscore.name(),
            classes: ['end-button', 'highscore']
        }));
        boxLayout.right.add(new Surface({
            content: highscore.val(),
            classes: ['end-button', 'highscore'],
            properties: {
                textAlign: 'right'
            }
        }));
        renderable.add(boxLayout);
        return renderable;
    }

    /**
     *
     */
    AppView.prototype._createHighscores = function() {
        this.highscores = {
            firebaseRef: new Firebase('https://white-tile.firebaseio.com/highscores'),
            scrollContainer: new ScrollContainer({
                scrollview: {
                    direction: 1
                },
                container: {
                    classes: ['end-button']
                }
            })
        }
        var boxLayout = new BoxLayout({
            margins: [10, 0, 10]
        });
        boxLayout.middle.add(this.highscores.scrollContainer);
        this.highscores.renderable = new RenderNode();
        this.highscores.renderable.add(boxLayout);
        this.highscores.firebaseRef.startAt().limit(50).on('value', function(highscores) {
            var renderables = [];
            var index = 1;
            highscores.forEach(function(highscore) {
                renderables.push(this._createHighscore(highscore, index));
                index++;
            }.bind(this));
            this.highscores.scrollContainer.sequenceFrom(renderables);
        }.bind(this));
        return this.highscores.renderable;
    }

    /**
     *
     */
    AppView.prototype._createNewScore = function() {
         var modifier = new Modifier({
            size: [undefined, 80],
            align: [0.5, 0.5],
            origin: [0.5, 0.5]
        });
        var surface = new Surface({
            classes: ['end-button', 'score'],
            content: 'Your score: 999'
        });
        this.scoreSurface = surface;
        var renderable = new RenderNode(modifier);
        renderable.add(surface);
        return renderable;
    }

    /**
     *
     */
    AppView.prototype._createUsername = function() {
         var modifier = new Modifier({
            size: [undefined, 50],
            align: [0.5, 0.5],
            origin: [0.5, 0.5]
        });
        var surface = new InputSurface({
            classes: ['end-button', 'username'],
            placeholder: 'enter name',
            value: localStorage.name
        });
        surface.on('blur', function() {
            localStorage.name = surface.getValue();
            surface.setValue(localStorage.name);
            this._submitHighscore();
        }.bind(this));
        surface.on('keyup', function(e) {
            if (e.keyCode === 13) {
                localStorage.name = surface.getValue();
                surface.setValue(localStorage.name);
                this._submitHighscore();
            }
        }.bind(this));
        var renderable = new RenderNode(modifier);
        renderable.add(surface);
        return renderable;
    }

    /**
     *
     */
    AppView.prototype._createRestartButton = function() {
         var modifier = new Modifier({
            size: [200, 60],
            align: [0.5, 0.5],
            origin: [0.5, 0.5]
        });
        var surface = new Surface({
            classes: ['end-button', 'restart'],
            content: 'Restart'
        });
        surface.on('click', this.restart.bind(this));
        var renderable = new RenderNode(modifier);
        renderable.add(surface);
        return renderable;
    }

    /**
     *
     */
    AppView.prototype._createFooter = function() {
         var modifier = new Modifier({
            align: [0.5, 0.5],
            origin: [0.5, 0.5],
            size: [undefined, 40]
        });
        var surface = new Surface({
            classes: ['end-button', 'footer'],
            content: '© 2014 - IjzerenHein'
        });
        var renderable = new RenderNode(modifier);
        renderable.add(surface);
        return renderable;
    }

    /**
     *
     */
    AppView.prototype._submitHighscore = function() {
        var name = localStorage.name;
        if (!name || name === '' || this._highScoreSubmitted) return;
        var newScore = this.counter.score;
        var newScoreRef = this.highscores.firebaseRef.child(name);
        this._highScoreSubmitted = true;
        newScoreRef.transaction(function(currentScore) {
            if (currentScore > newScore) {
                return undefined;
            }
            return newScore;
        },
        function(error, commited, snapshot) {
            if (!error && commited) {
                newScoreRef.setPriority(-newScore);
            }
        });
        
        newScoreRef.once('value', function(snapshot) {
            this.yourScoreSurface.setContent(snapshot.val());
        }.bind(this));
    }

    /**
     * @method reset
     */
    AppView.prototype.reset = function() {

        // Reset state
        this.transitionable.reset(0);
        this._isRunning = false;
        this._isStopped = false;
        this._highScoreSubmitted = false;
        this.yourScoreSurface.setContent('');

        // Reset rows
        for (var i = 0; i < this.rows.length; i++) {
            var row = this.rows[i];
            row.blackTile = -1;
            row.clickedTile = -1;
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                cell.surface.setClasses(['cell']);
            }
        }

        // Generate start tiles
        this.blackTiles = [{black: -2, clicked: -1}]; // first line is yellow
        for (var i = 0; i < 10; i++) {
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
    AppView.prototype.restart = function() {
        this.end.renderController.hide();
        this.reset();
    };

    /**
     * @method showEnd
     */
    AppView.prototype.showEnd = function() {
        this.scoreSurface.setContent('Your score: ' + this.counter.score);
        this.end.renderController.show(this.end.renderable);
        this._submitHighscore();
    };

    /**
     * @method _getTile
     */
    AppView.prototype._getTile = function(index) {
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
    AppView.prototype._onClickCell = function(rowIndex, cellIndex, event) {

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
    AppView.prototype.start = function() {
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
    AppView.prototype.speedup = function() {
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
    AppView.prototype.stop = function() {
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
        var y = 0;
        var rawOffset = this.transitionable.get();
        var offset = Math.floor(rawOffset);
        var start = offset % this.rows.length;

        // Determine offset of bottom row
        var fraction = (rawOffset % 1) * rowHeight;
        y = ((window.innerHeight + fraction) - rowHeight);

        // Update rows
        for (var i = 0; i < this.rows.length; i++) {
            var rowIndex = (i + start) % this.rows.length;
            var row = this.rows[rowIndex];

            // Set tile-color
            var tile = this._getTile(offset + i);
            if (row.blackTile !== tile.black) {
                if (row.blackTile >= 0) {
                    row.cells[row.blackTile].surface.removeClass('black');
                } else if (row.blackTile === -2) {
                    for (var j = 0; j < row.cells.length; j++) {
                        row.cells[j].surface.removeClass('yellow');
                    }
                }
                if (tile.black === -2) {
                    for (var j = 0; j < row.cells.length; j++) {
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
                for (var i = 0; i < 5; i++) {
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
