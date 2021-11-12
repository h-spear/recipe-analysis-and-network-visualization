let dataJson;
let prevColor;
let prevNode = '';
var sigInst, canvas, $GP;

let label;
const label_nation = [
    '한식',
    '퓨전',
    '서양',
    '이탈리아',
    '중국',
    '일본',
    '동남아시아',
    '멕시코',
];
const label_way = [
    '구이',
    '부침',
    '만두,면류',
    '밥,죽,스프',
    '볶음',
    '피자',
    '밑반찬,김치',
    '빵,과자',
    '국',
    '나물,생채,샐러드',
    '조림',
    '후식',
    '샌드위치,햄버거',
    '찜',
    '튀김,커틀릿',
    '양념장',
    '찌개,전골,스튜',
    '음료',
    '도시락,간식',
    '양식',
    '떡,한과',
    '그라탕,리조또',
];
const label_kind = [
    '닭고기류',
    '어류/패류',
    '쇠고기류',
    '가공식품류',
    '버섯류',
    '채소류',
    '곡류',
    '밀가루',
    '견과류',
    '알류',
    '돼지고기류',
    '과일류',
    '콩류',
    '기타',
    '해조류',
];
const label_modularity = [''];

const moreInfo2 = document.querySelector('.connection');
const popUp = document.querySelector('.message_connections');
moreInfo2.addEventListener('mouseover', () => {
    popUp.classList.remove('invisible');
});
moreInfo2.addEventListener('mouseout', () => {
    popUp.classList.add('invisible');
});

async function load() {
    var data = sessionStorage.getItem('dataSet');
    let select = 'not';
    if (data == 'not.json') {
        dataJson;
        labal = [];
        return;
    }
    if (data == 'data.json') {
        dataJson = await import('../data/data.js');
        select = 'nation';
    } else if (data == 'data_way.json') {
        dataJson = await import('../data/data_way.js');
        select = 'way';
    } else if (data == 'data_kind.json') {
        dataJson = await import('../data/data_kind.js');
        select = 'kind';
    } else if (data == 'data_modularity.json') {
        dataJson = await import('../data/data_modularity.js');
        select = 'modularity';
    }
    $('.clustering').val(select).prop('selected', true);
    dataJson = dataJson.default;
}

load();

$('.clustering').change(function () {
    let selected = $(this).val();
    switch (selected) {
        case 'not':
            sessionStorage.setItem('dataSet', 'not.json');
            location.reload();
            break;
        case 'nation':
            sessionStorage.setItem('dataSet', 'data.json');
            location.reload();
            break;
        case 'way':
            sessionStorage.setItem('dataSet', 'data_way.json');
            location.reload();
            break;
        case 'kind':
            sessionStorage.setItem('dataSet', 'data_kind.json');
            location.reload();
            break;
        case 'modularity':
            sessionStorage.setItem('dataSet', 'data_modularity.json');
            location.reload();
            break;
        default:
            console.log('Error!! ');
            return;
    }
});

//Load configuration file
var config = {};

function InfoChange(name) {
    let num, num2, degree, modularity, between;
    let nation, way, ingre1, ingre2, source, kind;
    dataJson.nodes.forEach((node) => {
        if (node.label === name) {
            num = node.attributes.번호;
            num2 = num;
            nation = node.attributes.국가;
            way = node.attributes.방법;
            ingre1 = node.attributes.주재료;
            ingre2 = node.attributes.부재료;
            source = node.attributes.양념;
            kind = node.attributes.종류;
            degree = node.attributes.Degree / 2;
            modularity = node.attributes['Modularity Class'];
            between = node.attributes['Betweenness Centrality'];
        }
    });
    if (num.length === 1) num = '000' + num;
    if (num.length === 2) num = '00' + num;
    if (num.length === 3) num = '0' + num;

    $('.recipe_image').attr(
        'src',
        `https://www.menupan.com/cook/cookimg/${num}00.jpg`
    );
    $('.info__link').attr(
        'href',
        `https://www.menupan.com/Cook/recipeview.asp?cookid=${num2}`
    );
    $('.info__name').html(name);
    $('.info__num').html(num2);
    $('.info__nation').html(nation);
    $('.info__way').html(way);
    $('.info__kind').html(kind);
    $('.info__ingre1').html(ingre1);
    $('.info__ingre2').html(ingre2);
    $('.info__source').html(source);
    $('.info__degree').html(degree);
    $('.info__between').html(Math.round(between));
    $('.info__modularity').html(modularity);
}

//For debug allow a config=file.json parameter to specify the config
function GetQueryStringParams(sParam, defaultVal) {
    var sPageURL = '' + window.location; //.search.substring(1);//This might be causing error in Safari?
    if (sPageURL.indexOf('?') == -1) return defaultVal;
    sPageURL = sPageURL.substr(sPageURL.indexOf('?') + 1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
    return defaultVal;
}

jQuery.getJSON(
    GetQueryStringParams('config', 'config.json'),
    function (data, textStatus, jqXHR) {
        config = data;

        if (config.type != 'network') {
            //bad config
            alert('Invalid configuration settings.');
            return;
        }

        //As soon as page is ready (and data ready) set up it
        $(document).ready(setupGUI(config));
    }
); //End JSON Config load

// FUNCTION DECLARATIONS

Object.size = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function initSigma(config) {
    var data = 'data/' + sessionStorage.getItem('dataSet');
    var drawProps, graphProps, mouseProps;
    if (config.sigma && config.sigma.drawingProperties)
        drawProps = config.sigma.drawingProperties;
    else
        drawProps = {
            defaultLabelColor: '#000',
            defaultLabelSize: 14,
            defaultLabelBGColor: '#ddd',
            defaultHoverLabelBGColor: '#002147',
            defaultLabelHoverColor: '#fff',
            labelThreshold: 10,
            defaultEdgeType: 'curve',
            hoverFontStyle: 'bold',
            fontStyle: 'bold',
            activeFontStyle: 'bold',
        };

    if (config.sigma && config.sigma.graphProperties)
        graphProps = config.sigma.graphProperties;
    else
        graphProps = {
            minNodeSize: 1,
            maxNodeSize: 7,
            minEdgeSize: 0.2,
            maxEdgeSize: 0.5,
        };

    if (config.sigma && config.sigma.mouseProperties)
        mouseProps = config.sigma.mouseProperties;
    else
        mouseProps = {
            minRatio: 0.75, // How far can we zoom out?
            maxRatio: 20, // How far can we zoom in?
        };

    var a = sigma
        .init(document.getElementById('sigma-canvas'))
        .drawingProperties(drawProps)
        .graphProperties(graphProps)
        .mouseProperties(mouseProps);
    sigInst = a;
    a.active = !1;
    a.neighbors = {};
    a.detail = !1;

    dataReady = function () {
        //This is called as soon as data is loaded
        a.clusters = {};

        a.iterNodes(function (b) {
            //This is where we populate the array used for the group select box

            // note: index may not be consistent for all nodes. Should calculate each time.
            // alert(JSON.stringify(b.attr.attributes[5].val));
            // alert(b.x);
            a.clusters[b.color] || (a.clusters[b.color] = []);
            a.clusters[b.color].push(b.id); //SAH: push id not label
        });

        a.bind('upnodes', function (a) {
            nodeActive(a.content[0]);
        });

        a.draw();
        configSigmaElements(config);
    };

    if (data.indexOf('gexf') > 0 || data.indexOf('xml') > 0)
        a.parseGexf(data, dataReady);
    else a.parseJson(data, dataReady);
    gexf = sigmaInst = null;
}

function setupGUI(config) {
    $GP = {
        calculating: !1,
        showgroup: !1,
    };
    $GP.intro = $('#intro');
    $GP.minifier = $GP.intro.find('#minifier');
    $GP.mini = $('#minify');
    $GP.info = $('#attributepane');
    $GP.info_donnees = $GP.info.find('.nodeattributes');
    $GP.info_name = $GP.info.find('.name');
    $GP.info_link = $GP.info.find('.link');
    $GP.info_data = $GP.info.find('.data');
    $GP.info_close = $GP.info.find('.returntext');
    $GP.info_close2 = $GP.info.find('.close');
    $GP.info_p = $GP.info.find('.p');
    $GP.info_close.click(nodeNormal);
    $GP.info_close2.click(nodeNormal);
    $GP.form = $('#mainpanel').find('form');
    $GP.search = new Search($GP.form.find('#search'));
    if (!config.features.search) {
        $('#search').hide();
    }
    if (!config.features.groupSelectorAttribute) {
        $('#attributeselect').hide();
    }
    $GP.cluster = new Cluster($GP.form.find('#attributeselect'));
    config.GP = $GP;
    initSigma(config);
}
function setLabel() {
    var data = sessionStorage.getItem('dataSet');
    if (data == 'not.json') labal = [];
    if (data == 'data.json') label = label_nation;
    else if (data == 'data_way.json') label = label_way;
    else if (data == 'data_kind.json') label = label_kind;
    else if (data == 'data_modularity.json') label = label_modularity;
}

function configSigmaElements(config) {
    $GP = config.GP;

    // Node hover behaviour
    if (config.features.hoverBehavior == 'dim') {
        var greyColor = '#ccc';
        sigInst
            .bind('overnodes', function (event) {
                var nodes = event.content;
                var neighbors = {};
                sigInst
                    .iterEdges(function (e) {
                        if (
                            nodes.indexOf(e.source) < 0 &&
                            nodes.indexOf(e.target) < 0
                        ) {
                            if (!e.attr['grey']) {
                                e.attr['true_color'] = e.color;
                                e.color = greyColor;
                                e.attr['grey'] = 1;
                            }
                        } else {
                            e.color = e.attr['grey']
                                ? e.attr['true_color']
                                : e.color;
                            e.attr['grey'] = 0;

                            neighbors[e.source] = 1;
                            neighbors[e.target] = 1;
                        }
                    })
                    .iterNodes(function (n) {
                        if (!neighbors[n.id]) {
                            if (!n.attr['grey']) {
                                n.attr['true_color'] = n.color;
                                n.color = greyColor;
                                n.attr['grey'] = 1;
                            }
                        } else {
                            n.color = n.attr['grey']
                                ? n.attr['true_color']
                                : n.color;
                            n.attr['grey'] = 0;
                        }
                    })
                    .draw(2, 2, 2);
            })
            .bind('outnodes', function () {
                sigInst
                    .iterEdges(function (e) {
                        e.color = e.attr['grey']
                            ? e.attr['true_color']
                            : e.color;
                        e.attr['grey'] = 0;
                    })
                    .iterNodes(function (n) {
                        n.color = n.attr['grey']
                            ? n.attr['true_color']
                            : n.color;
                        n.attr['grey'] = 0;
                    })
                    .draw(2, 2, 2);
            });
    } else if (config.features.hoverBehavior == 'hide') {
        sigInst
            .bind('overnodes', function (event) {
                var nodes = event.content;
                var neighbors = {};
                sigInst
                    .iterEdges(function (e) {
                        if (
                            nodes.indexOf(e.source) >= 0 ||
                            nodes.indexOf(e.target) >= 0
                        ) {
                            neighbors[e.source] = 1;
                            neighbors[e.target] = 1;
                        }
                    })
                    .iterNodes(function (n) {
                        if (!neighbors[n.id]) {
                            n.hidden = 1;
                        } else {
                            n.hidden = 0;
                        }
                    })
                    .draw(2, 2, 2);
            })
            .bind('outnodes', function () {
                sigInst
                    .iterEdges(function (e) {
                        e.hidden = 0;
                    })
                    .iterNodes(function (n) {
                        n.hidden = 0;
                    })
                    .draw(2, 2, 2);
            });
    }
    $GP.bg = $(sigInst._core.domElements.bg);
    $GP.bg2 = $(sigInst._core.domElements.bg2);
    var a = [],
        b,
        x = 0;
    setLabel();
    for (b in sigInst.clusters)
        a.push(
            '<div style="line-height:12px"><a href="#' +
                b +
                '"><div style="width:40px;height:12px;border:1px solid #fff;background:' +
                b +
                ';display:inline-block"></div> ' +
                label[x++] +
                ' (' +
                sigInst.clusters[b].length +
                ' members)</a></div>'
        );
    var regex = /[^0-9]/g; // 숫자가 아닌 문자열을 매칭하는 정규식
    a.sort(function (a, b) {
        a = a.slice(a.indexOf(' (')).replace(regex, '');
        b = b.slice(b.indexOf(' (')).replace(regex, '');
        return b - a;
    });
    $GP.cluster.content(a.join(''));
    b = {
        minWidth: 400,
        maxWidth: 800,
        maxHeight: 600,
    }; //        minHeight: 300,
    $('a.fb').fancybox(b);
    $('#zoom')
        .find('div.z')
        .each(function () {
            var a = $(this),
                b = a.attr('rel');
            a.click(function () {
                if (b == 'center') {
                    sigInst.position(0, 0, 1).draw();
                } else {
                    var a = sigInst._core;
                    sigInst.zoomTo(
                        a.domElements.nodes.width / 2,
                        a.domElements.nodes.height / 2,
                        a.mousecaptor.ratio * ('in' == b ? 1.5 : 0.5)
                    );
                }
            });
        });
    $GP.mini.click(function () {
        $GP.mini.hide();
        $GP.intro.show();
        $GP.minifier.show();
    });
    $GP.minifier.click(function () {
        $GP.intro.hide();
        $GP.minifier.hide();
        $GP.mini.show();
    });
    $GP.intro.find('#showGroups').click(function () {
        !0 == $GP.showgroup ? showGroups(!1) : showGroups(!0);
    });
    a = window.location.hash.substr(1);
    if (0 < a.length) {
        switch (a) {
            case 'Groups':
                showGroups(!0);
                break;
            case 'information':
                $.fancybox.open($('#information'), b);
                break;
            default:
                ($GP.search.exactMatch = !0), $GP.search.search(a);
                $GP.search.clean();
        }
    }
}

function Search(a) {
    this.input = a.find('input[name=search]');
    this.state = a.find('.state');
    this.results = a.find('.results');
    this.exactMatch = !1;
    this.lastSearch = '';
    this.searching = !1;
    var b = this;
    this.input.focus(function () {
        var a = $(this);
        a.data('focus') || (a.data('focus', !0), a.removeClass('empty'));
        b.clean();
    });
    this.input.keydown(function (a) {
        if (13 == a.which)
            return b.state.addClass('searching'), b.search(b.input.val()), !1;
    });
    this.state.click(function () {
        var a = b.input.val();
        b.searching && a == b.lastSearch
            ? b.close()
            : (b.state.addClass('searching'), b.search(a));
    });
    this.dom = a;
    this.close = function () {
        this.state.removeClass('searching');
        this.results.hide();
        this.searching = !1;
        this.input.val(''); //SAH -- let's erase string when we close
        nodeNormal();
    };
    this.clean = function () {
        this.results.empty().hide();
        this.state.removeClass('searching');
        this.input.val('');
    };
    this.search = function (a) {
        var b = !1,
            c = [],
            b = this.exactMatch
                ? ('^' + a + '$').toLowerCase()
                : a.toLowerCase(),
            g = RegExp(b);
        this.exactMatch = !1;
        this.searching = !0;
        this.lastSearch = a;
        this.results.empty();
        if (0 >= a.length)
            this.results.html('<i>please fill in the blanks.</i>');
        else {
            sigInst.iterNodes(function (a) {
                g.test(a.label.toLowerCase()) &&
                    c.push({
                        id: a.id,
                        name: a.label,
                    });
            });
            c.length ? ((b = !0), nodeActive(c[0].id)) : (b = showCluster(a));
            a = ['<b>Search Results: </b>'];
            if (1 < c.length)
                for (var d = 0, h = c.length; d < h; d++)
                    a.push(
                        '<a href="#' +
                            c[d].name +
                            '" onclick="nodeActive(\'' +
                            c[d].id +
                            '\')">' +
                            c[d].name +
                            '</a>'
                    );
            0 == c.length && !b && a.push('<i>No results found.</i>');
            1 < a.length && this.results.html(a.join(''));
        }
        if (c.length != 1) this.results.show();
        if (c.length == 1) this.results.hide();
    };
}

function Cluster(a) {
    this.cluster = a;
    this.display = !1;
    this.list = this.cluster.find('.list');
    this.list.empty();
    this.select = this.cluster.find('.select');
    this.select.click(function () {
        $GP.cluster.toggle();
    });
    this.toggle = function () {
        this.display ? this.hide() : this.show();
    };
    this.content = function (a) {
        this.list.html(a);
        this.list.find('a').click(function () {
            var a = $(this).attr('href').substr(1);
            showCluster(a);
        });
    };
    this.hide = function () {
        this.display = !1;
        this.list.hide();
        this.select.removeClass('close');
    };
    this.show = function () {
        this.display = !0;
        this.list.show();
        this.select.addClass('close');
    };
}
function showGroups(a) {
    a
        ? ($GP.intro.find('#showGroups').text('Hide groups'),
          $GP.bg.show(),
          $GP.bg2.hide(),
          ($GP.showgroup = !0))
        : ($GP.intro.find('#showGroups').text('View Groups'),
          $GP.bg.hide(),
          $GP.bg2.show(),
          ($GP.showgroup = !1));

    prevNode.color = prevColor;
    prevNode = '';
    prevColor = '';
    $('.info').hide();
}

function nodeNormal() {
    !0 != $GP.calculating &&
        !1 != sigInst.detail &&
        (showGroups(!1),
        ($GP.calculating = !0),
        (sigInst.detail = !0),
        $GP.info.delay(400).animate({ width: 'hide' }, 350),
        $GP.cluster.hide(),
        sigInst.iterEdges(function (a) {
            a.attr.color = !1;
            a.hidden = !1;
        }),
        sigInst.iterNodes(function (a) {
            a.hidden = !1;
            a.attr.color = !1;
            a.attr.lineWidth = !1;
            a.attr.size = !1;
        }),
        sigInst.draw(2, 2, 2, 2),
        (sigInst.neighbors = {}),
        (sigInst.active = !1),
        ($GP.calculating = !1),
        (window.location.hash = ''));
}

function nodeActive(a) {
    var groupByDirection = false;
    if (
        config.informationPanel.groupByEdgeDirection &&
        config.informationPanel.groupByEdgeDirection == true
    )
        groupByDirection = true;

    sigInst.neighbors = {};
    sigInst.detail = !0;
    var b = sigInst._core.graph.nodesIndex[a];

    showGroups(!1);
    var outgoing = {},
        incoming = {},
        mutual = {}; //SAH
    sigInst.iterEdges(function (b) {
        b.attr.lineWidth = !1;
        b.hidden = !0;

        n = {
            name: b.label,
            colour: b.color,
        };

        if (a == b.source) outgoing[b.target] = n;
        //SAH
        else if (a == b.target) incoming[b.source] = n; //SAH
        if (a == b.source || a == b.target)
            sigInst.neighbors[a == b.target ? b.source : b.target] = n;
        (b.hidden = !1), (b.attr.color = 'rgba(0, 0, 0, 1)');
    });
    var f = [];
    sigInst.iterNodes(function (a) {
        a.hidden = !0;
        a.attr.lineWidth = !1;
        a.attr.color = a.color;
    });

    if (groupByDirection) {
        //SAH - Compute intersection for mutual and remove these from incoming/outgoing
        for (e in outgoing) {
            //name=outgoing[e];
            if (e in incoming) {
                mutual[e] = outgoing[e];
                delete incoming[e];
                delete outgoing[e];
            }
        }
    }

    var createList = function (c) {
        var f = [];
        var e = [],
            //c = sigInst.neighbors,
            g;
        for (g in c) {
            var d = sigInst._core.graph.nodesIndex[g];
            d.hidden = !1;
            d.attr.lineWidth = !1;
            d.attr.color = c[g].colour;
            a != g &&
                e.push({
                    id: g,
                    name: d.label,
                    group: c[g].name ? c[g].name : '',
                    colour: c[g].colour,
                });
        }
        e.sort(function (a, b) {
            var c = a.group.toLowerCase(),
                d = b.group.toLowerCase(),
                e = a.name.toLowerCase(),
                f = b.name.toLowerCase();
            return c != d
                ? c < d
                    ? -1
                    : c > d
                    ? 1
                    : 0
                : e < f
                ? -1
                : e > f
                ? 1
                : 0;
        });
        nowSee = [];
        dataJson.edges.forEach((e) => {
            if (e.source == b.id) {
                nowSee.push([e.target, e.size]);
            }
        });
        e.sort(function (a, b) {
            c = 0;
            d = 0;
            nowSee.forEach((now) => {
                if (now[0] === a.id) c = now[1];
                if (now[0] === b.id) d = now[1];
            });
            return d - c;
        });
        nowSee.sort(function (a, b) {
            return b[1] - a[1];
        });
        d = '';
        for (g in e) {
            c = e[g];
            /*if (c.group != d) {
				d = c.group;
				f.push('<li class="cf" rel="' + c.color + '"><div class=""></div><div class="">' + d + "</div></li>");
			}*/
            f.push(
                '<li class="membership"><a href="#' +
                    c.name +
                    '" class="connections_a" onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' +
                    c.id +
                    '\'])" onclick="nodeActive(\'' +
                    c.id +
                    '\')" onmouseout="sigInst.refresh()">' +
                    '<span class="connections_name">' +
                    c.name +
                    '</span>' +
                    '<span class="connections_weight">' +
                    nowSee[g][1].toFixed(3) +
                    '</span>' +
                    '</a></li>'
            );
        }
        if (prevNode !== '') {
            prevNode.color = prevColor;
        }
        prevNode = b;
        prevColor = b.color;
        b.color = 'rgba(255, 0, 0, 1)';
        InfoChange(b.label);
        $('.nodeattributes').animate({ scrollTop: 0 }, 400);
        $('.info').show();
        return f;
    };

    /*console.log("mutual:");
	console.log(mutual);
	console.log("incoming:"); 
	console.log(incoming);
	console.log("outgoing:");
	console.log(outgoing);*/

    var f = [];

    //console.log("neighbors:");
    //console.log(sigInst.neighbors);

    if (groupByDirection) {
        size = Object.size(mutual);
        f.push('<h2>Mututal (' + size + ')</h2>');
        size > 0
            ? (f = f.concat(createList(mutual)))
            : f.push('No mutual links<br>');
        size = Object.size(incoming);
        f.push('<h2>Incoming (' + size + ')</h2>');
        size > 0
            ? (f = f.concat(createList(incoming)))
            : f.push('No incoming links<br>');
        size = Object.size(outgoing);
        f.push('<h2>Outgoing (' + size + ')</h2>');
        size > 0
            ? (f = f.concat(createList(outgoing)))
            : f.push('No outgoing links<br>');
    } else {
        f = f.concat(createList(sigInst.neighbors));
    }
    //b is object of active node -- SAH
    b.hidden = !1;
    b.attr.color = b.color;
    b.attr.lineWidth = 6;
    b.attr.strokeStyle = '#000000';
    sigInst.draw(2, 2, 2, 2);

    $GP.info_link.find('ul').html(f.join(''));
    $GP.info_link.find('li').each(function () {
        var a = $(this),
            b = a.attr('rel');
    });
    f = b.attr;
    if (f.attributes) {
        var image_attribute = false;
        if (config.informationPanel.imageAttribute) {
            image_attribute = config.informationPanel.imageAttribute;
        }
        e = [];
        temp_array = [];
        g = 0;
        for (var attr in f.attributes) {
            var d = f.attributes[attr],
                h = '';
            if (attr != image_attribute) {
                h =
                    '<span><strong>' +
                    attr +
                    ':</strong> ' +
                    d +
                    '</span><br/>';
            }
            //temp_array.push(f.attributes[g].attr);
            e.push(h);
        }

        if (image_attribute) {
            //image_index = jQuery.inArray(image_attribute, temp_array);
            $GP.info_name.html(
                '<div><img src=' +
                    f.attributes[image_attribute] +
                    ' style="vertical-align:middle" /> <span onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' +
                    b.id +
                    '\'])" onmouseout="sigInst.refresh()">' +
                    b.label +
                    '</span></div>'
            );
        } else {
            $GP.info_name.html(
                '<div><span onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' +
                    b.id +
                    '\'])" onmouseout="sigInst.refresh()">' +
                    b.label +
                    '</span></div>'
            );
        }
        // Image field for attribute pane
        $GP.info_data.html(e.join('<br/>'));
    }

    $GP.info_data.show();
    $GP.info_p.html('Connections:');
    $GP.info.animate({ width: 'show' }, 350);
    $GP.info_donnees.hide();
    $GP.info_donnees.show();
    sigInst.active = a;
    window.location.hash = b.label;
}

function showCluster(a) {
    var b = sigInst.clusters[a];
    if (b && 0 < b.length) {
        showGroups(!1);
        sigInst.detail = !0;
        b.sort();
        sigInst.iterEdges(function (a) {
            a.hidden = !1;
            a.attr.lineWidth = !1;
            a.attr.color = !1;
        });
        sigInst.iterNodes(function (a) {
            a.hidden = !0;
        });
        for (var f = [], e = [], c = 0, g = b.length; c < g; c++) {
            var d = sigInst._core.graph.nodesIndex[b[c]];
            !0 == d.hidden &&
                (e.push(b[c]),
                (d.hidden = !1),
                (d.attr.lineWidth = !1),
                (d.attr.color = d.color),
                f.push(
                    '<li class="membership"><a href="#' +
                        d.label +
                        '" onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' +
                        d.id +
                        '\'])" onclick="nodeActive(\'' +
                        d.id +
                        '\')" onmouseout="sigInst.refresh()">' +
                        d.label +
                        '</a></li>'
                ));
        }
        sigInst.clusters[a] = e;
        sigInst.draw(2, 2, 2, 2);
        $GP.info_name.html('<b>' + a + '</b>');
        $GP.info_data.hide();
        $GP.info_p.html('Group Members:');
        $GP.info_link.find('ul').html(f.join(''));
        $GP.info.animate({ width: 'show' }, 350);
        $GP.search.clean();
        $GP.cluster.hide();
        return !0;
    }
    return !1;
}
