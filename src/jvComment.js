/***  jvComment ***/
function jvComment(configObj) {
    'use strict';
    var commentObj = this;
    commentObj.chartDiv = configObj.chartDiv;
    commentObj.showComments = false;
    commentObj.comments = configObj.comments ? configObj.comments : {};
    commentObj.disabled = false;
    commentObj.drawCommentNodes();
    commentObj.onSaveCallback = configObj.onSaveCallback;
    commentObj.getMode = configObj.getMode;
}
/********************************************* All Comment Mode Functions **************************************************/
jvComment.prototype.createMoveListener = function (commentNode) {
    var commentObj = this;
    var timeMouseDown = new Date().getTime();
    commentObj.chartDiv.on('mousemove', function () {
        //mouse move happend too quickly, chrome bug
        var timeMouseMove = new Date().getTime();
        if (timeMouseDown + 10 > timeMouseMove) {
            return;
        }

        //move the comment node
        commentObj.moved = commentNode;

        //mouse move happened inside the bottom right corner, feature
        var node = commentNode.node();
        var mouse = d3.mouse(node);
        if (commentNode.select(".comment-padding")._groups[0][0] && ((mouse[0] + 15 > node.clientWidth && mouse[1] + 15 > node.clientHeight) || commentObj.moved.mouse)) {
            if (!commentObj.moved.mouse) {
                var resizeNode = commentNode.select(".comment-padding");
                resizeNode.style('width', 'auto');
                resizeNode.style('height', 'auto');
            }

            //move the comment node
            commentObj.moved.mouse = mouse;
            return;
        }

        if (commentNode._groups[0][0].nodeName === 'text') {
            commentObj.chartDiv.select('.commentbox-readonly').remove();
        }
        commentNode
            .style('left', d3.event.clientX + 'px')
            .style('top', d3.event.clientY + 'px');
        commentNode
            .attr('x', d3.event.clientX)
            .attr('y', d3.event.clientY);
    });
};

jvComment.prototype.updatePosition = function () {
    var commentObj = this;
    var nodeToUpdate = commentObj.moved._groups[0][0];
    var nodeId = nodeToUpdate.id.split('node')[1];
    var comment = commentObj.comments.list[nodeId];
    if (Array.isArray(commentObj.moved.mouse)) {
        comment.binding.width = commentObj.moved.mouse[0];
        comment.binding.height = commentObj.moved.mouse[1];
    } else {
        var x = Math.round(nodeToUpdate.getAttribute('x'));
        var y = Math.round(nodeToUpdate.getAttribute('y'));
        comment.binding = {
            'x': x,
            'y': y,
            'xChartArea': commentObj.chartDiv._groups[0][0].clientWidth,
            'yChartArea': commentObj.chartDiv._groups[0][0].clientHeight,
            'currentX': x,
            'currentY': y,
            'showAsMarker': comment.binding.showAsMarker,
            'height': comment.binding.height,
            'width': comment.binding.width
        };
    }

    commentObj.onSaveCallback(comment, nodeId, 'edit');
};


jvComment.prototype.makeComment = function (event) {
    var commentObj = this;

    commentObj.showComments = false;
    commentObj.chartDiv.selectAll('.commentbox-readonly').remove();

    if (commentObj.chartDiv.selectAll('.commentbox')._groups[0].length === 0 && commentObj.chartDiv.selectAll('.commentbox-edit')._groups[0].length === 0) {
        var x = parseInt(d3.mouse(event)[0]);
        var y = parseInt(d3.mouse(event)[1]);

        //calculate position of overlay div
        var commentHeight = 145,
            commentWidth = 200,
            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

        commentObj.chartDiv.append('div')
            .attr('class', 'commentbox')
            .attr('id', 'commentbox')
            .style('opacity', 1)
            .html("<div class='title'><b>Add New Comment</b></div>" +
            "<textarea placeholder='Enter comment...' form='commentform' class='comment-textarea' style='width:155px; height: 90px;' name='comment' id = 'textarea1'></textarea>" +
            "<br><input type='checkBox' class='commentbox-display' id ='display'> Display as marker" +
            "<br><button class='commentbox-close' id ='cancel'><i class='fa fa-close'></i></button>" +
            "<button class='smss-btn commentbox-submit' id = 'submit'>Submit Comment</button>")
            .style('position', 'absolute')
            .style('left', position.x + 'px')
            .style('top', position.y + 'px');

        //Autofocus on the text area
        document.getElementById('textarea1').focus();

        commentObj.chartDiv.selectAll('.commentbox').select('#cancel')
            .on('click.delete', function () {
                commentObj.removeComment();
            });

        var commentType = 'svgMain';

        commentObj.chartDiv.selectAll('.commentbox').select('#submit')
            .on('click.save', function () {
                var commentText = commentObj.chartDiv.select('#commentbox').select('#textarea1')._groups[0][0].value,
                    showAsMarker = commentObj.chartDiv.select('#commentbox').select('#display')._groups[0][0].checked,
                    newCommentObj;

                newCommentObj = {
                    'commentText': commentText,
                    'groupID': 'group0',
                    'type': commentType,
                    'binding': {
                        'x': x,
                        'y': y,
                        'xChartArea': commentObj.chartDiv._groups[0][0].clientWidth,
                        'yChartArea': commentObj.chartDiv._groups[0][0].clientHeight,
                        'currentX': x,
                        'currentY': y,
                        'showAsMarker': showAsMarker ? 'true' : 'false',
                        'height': false,
                        'width': false
                    }
                };
                commentObj.chartDiv.select('.commentbox').remove();
                if (isNaN(commentObj.comments.maxId)) {
                    commentObj.comments.maxId = -1;
                }
                commentObj.onSaveCallback(newCommentObj, ++commentObj.comments.maxId, 'add');
            });
    }
};

jvComment.prototype.removeComment = function () {
    var commentObj = this;
    var chartDiv = commentObj.chartDiv;
    chartDiv.selectAll('.commentbox').remove();
};

jvComment.prototype.showAllComments = function () {
    var commentObj = this;

    //Remove any comment boxes if comments are being toggled
    commentObj.chartDiv.selectAll('.commentbox').remove();
    commentObj.chartDiv.selectAll('.commentbox-edit').remove();

    if (commentObj.showComments === false) {
        for (var i in commentObj.comments.list) {
            if (!commentObj.comments.list[i].binding) {
                console.log('Comment is in old format, will not display');
                return;
            }

            var value = commentObj.comments.list[i];
            var chartAreaWidth = commentObj.chartDiv._groups[0][0].clientWidth;
            var chartAreaHeight = commentObj.chartDiv._groups[0][0].clientHeight;
            var x = (commentObj.comments.list[i].binding.x / commentObj.comments.list[i].binding.xChartArea * chartAreaWidth);
            var y = (commentObj.comments.list[i].binding.y / commentObj.comments.list[i].binding.yChartArea * chartAreaHeight);
            var commentText = value.commentText;
            var commentHeight = 80,
                commentWidth = 185,
                position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

            commentObj.chartDiv.append('div')
                .attr('class', 'commentbox-readonly')
                .attr('id', 'commentbox-readonly' + i)
                .style('position', 'absolute')
                .style('opacity', 1)
                //.style("border", "1px solid black")
                .html("<textarea readonly class='comment-textarea' rows='4' cols='27' name='comment'>" + commentText + '</textarea>')
                .style('left', position.x + 'px')
                .style('top', position.y + 'px');
        }
        commentObj.showComments = true;
        //chart.toolBar.select("#topBarButton"+chart.config.name+"showallcomments").select('button').classed('toggled', true);
    } else {
        commentObj.chartDiv.selectAll('.commentbox-readonly').remove();
        commentObj.showComments = false;
        //chart.toolBar.select("#topBarButton"+chart.config.name+"showallcomments").select('button').classed('toggled', false);
    }
};

jvComment.prototype.drawCommentNodes = function () {
    var commentObj = this;

    var comments = commentObj.comments.list;
    var chartDiv = commentObj.chartDiv;

    chartDiv.selectAll('.min-comment').remove();

    for (var id in comments) {
        commentObj.drawComment(comments[id], chartDiv, id);
    }
};

jvComment.prototype.drawComment = function (comment, chartDiv, id) {
    var commentObj = this;
    if (typeof chartDiv._groups === 'undefined') {
        console.log('Comment data is in old format, will not display or chart div doesnt exist');
        return;
    }

    if (!comment.binding || !chartDiv._groups[0][0]) {
        console.log('Comment data is in old format, will not display or chart div doesnt exist');
        return;
    }

    var chartAreaWidth = chartDiv._groups[0][0].clientWidth;
    var chartAreaHeight = chartDiv._groups[0][0].clientHeight;
    var x = (comment.binding.x / comment.binding.xChartArea * chartAreaWidth);
    var y = (comment.binding.y / comment.binding.yChartArea * chartAreaHeight);
    comment.binding.currentX = (comment.binding.x / comment.binding.xChartArea * chartAreaWidth);
    comment.binding.currentY = (comment.binding.y / comment.binding.yChartArea * chartAreaHeight);

    if (comment.binding.showAsMarker === 'false') {
        var styleString = '',
            text = '',
            resize = false;
        if (comment.binding.width && comment.binding.height) {
            styleString = "style='width: " + comment.binding.width + 'px; height: ' + comment.binding.height + "px'";
        }
        if (comment.commentText.indexOf('<iframe') > -1 || comment.commentText.indexOf('<img') > -1 || comment.commentText.indexOf('<svg') > -1) {
            //contains elents that should resize
            text = "<div class='comment-padding'" + styleString + "><div class='user-comment'>" + comment.commentText + '</div></div>';
            resize = true;
        } else {
            text = comment.commentText;
        }
        chartDiv.append('div')
            .attr('class', 'min-comment')
            .attr('id', 'node' + id)
            .style('opacity', 1)
            .style('position', 'absolute')
            //.style("border", "1px solid black")
            .html(text)
            .style('left', x + 'px')
            .style('top', y + 'px')
            .on('dblclick.comment', function () {//Edit text or delete the comment
                commentObj.doubleClick(this, x, y);
            });
        if (resize) {
            var parent = d3.select(".user-comment");
            rescale(parent, parent.node());
        }
    } else {
        chartDiv.select('svg').append('text')
            .attr('class', 'min-comment')
            .attr('id', 'node' + id)
            .attr('fill', '#e6e6e6')
            .attr('x', x)
            .attr('y', y)
            .attr('font-family', 'FontAwesome')
            .attr('stroke', 'darkgray')
            .attr('font-size', function (d) {
                return '15px';
            })
            .text(function (d) {
                return '\uf0e5';
            })
            .attr('opacity', 1)
            .on('dblclick.comment', function () {//Edit text or delete the comment
                commentObj.doubleClick(this, x, y);
            })
            .on('mouseenter.comment', function (d) {//Show hover over box when mouse enters node
                if (commentObj.showComments === false) {
                    var commentText = '';

                    for (var j in commentObj.comments.list) {
                        if (Math.round(commentObj.comments.list[j].binding.currentX) === Math.round(this.x.baseVal[0].value)) {
                            if (Math.round(commentObj.comments.list[j].binding.currentY) === Math.round(this.y.baseVal[0].value)) {
                                commentText = commentObj.comments.list[j].commentText;
                                x = commentObj.comments.list[j].binding.currentX;
                                y = commentObj.comments.list[j].binding.currentY;
                            }
                        }
                    }

                    var commentHeight = 80,
                        commentWidth = 185,
                        position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

                    var commentDiv = chartDiv.append('div')
                        .attr('class', 'commentbox-readonly')
                        .style('opacity', 1)
                        .style('position', 'absolute')
                        //.style("border", "1px solid black")
                        .html("<textarea readonly rows='4' cols='27' class='textarea' name='comment'>" + commentText + '</textarea>')
                        .style('left', position.x + 'px')
                        .style('top', position.y + 'px');
                }
            })
            .on('mouseout.comment', function (d) {//Remove hover over box when mouse moves away
                if (commentObj.showComments === false) {
                    chartDiv.select('.commentbox-readonly').remove();
                }
            });
    }
};

function rescale(ele, commentNode) {
    var node = ele.node(),
        width = 100,
        height = 100;
    // width = node.clientWidth / commentNode.clientWidth * 100;
    // height = node.clientHeight / commentNode.clientHeight * 100;
    // if (width > 100) {
    //     width = 100;
    // }

    // if (height > 100) {
    //     height = 100;
    // }

    ele.style('width', width + '%');
    ele.style('height', height + '%');
    for (var child of node.childNodes) {
        rescale(d3.select(child), commentNode);
    }
}

jvComment.prototype.doubleClick = function (commentNode, x, y) {
    var commentObj = this;
    var chartDiv = commentObj.chartDiv;
    if (commentObj.getMode() === 'comment-mode') {
        commentObj.showComments = false;
        chartDiv.selectAll('.commentbox-readonly').remove();
        var currentComment = commentNode.id.split('node')[1];
        var commentText = commentObj.comments.list[currentComment].commentText;
        var commentHeight = 145,
            commentWidth = 200,
            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);
        chartDiv.append('div')
            .attr('class', 'commentbox-edit')
            .style('opacity', 1)
            .style('left', position.x + 'px')
            .style('top', position.y + 'px')
            .style('position', 'absolute')
            //.style("border", "1px solid black")
            .html("<div class='title'><b>Edit Comment</b></div>" +
            "<textarea id='edit' class='comment-textarea' style='width:155px; height: 90px;' name='comment'>" + commentText + '</textarea>' +
            "<br><input type='checkBox' class='commentbox-display' id ='display'> Display as marker" +
            "<br><button class='commentbox-close' id ='cancel-edit'><i class='fa fa-close'></i></button>" +
            "<button class='smss-btn' id ='delete'>Delete</button>" +
            "<button class='smss-btn' id = 'save'>Save</button>");
        chartDiv.select('.commentbox-edit').select('#display')._groups[0][0].checked = commentObj.comments.list[currentComment].binding.showAsMarker === 'true';

        chartDiv.selectAll('.commentbox-edit').select('#delete')
            .on('click.delete', function () {
                chartDiv.select('.commentbox-edit').remove();
                chartDiv.select('.commentbox-readonly').remove();
                chartDiv.select('#node' + currentComment).attr('display', 'none');
                //redraw comment nodes with new indexes
                commentObj.onSaveCallback(commentObj.comments.list[currentComment], currentComment, 'remove');
            });

        chartDiv.selectAll('.commentbox-edit').select('#save')
            .on('click.save', function () {
                var commentText = chartDiv.select('.commentbox-edit').select('#edit')._groups[0][0].value,
                    showAsMarker = chartDiv.select('.commentbox-edit').select('#display')._groups[0][0].checked;
                commentObj.comments.list[currentComment].commentText = commentText;
                commentObj.comments.list[currentComment].binding.showAsMarker = showAsMarker ? 'true' : 'false';
                chartDiv.select('.commentbox-readonly').remove();
                chartDiv.select('.commentbox-edit').remove();
                commentObj.onSaveCallback(commentObj.comments.list[currentComment], currentComment, 'edit');
            });

        chartDiv.selectAll('.commentbox-edit').select('#cancel-edit')
            .on('click.cancel-edit', function () {
                chartDiv.select('.commentbox-readonly').remove();
                chartDiv.select('.commentbox-edit').remove();
            });
    }
};


/******************************* Utility functions **********************************************/

jvComment.prototype.overlayDivPosition = function (divWidth, divHeight, mouseX, mouseY) {
    var commentObj = this;
    var position = {};
    if (mouseX > (parseInt(commentObj.chartDiv.style('width'))) / 2) {
        position.x = mouseX - divWidth - 5;
    } else {
        position.x = mouseX + 10;
    }
    if (mouseY - divHeight - 10 > 0) {
        position.y = mouseY - divHeight - 10;
    } else {
        position.y = mouseY + 10;
    }
    return position;
};

module.exports = jvComment;
