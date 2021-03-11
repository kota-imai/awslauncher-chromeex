// Region Selector init
getJSON("data/region.json")
    .then(data => {
        var defaultRegion = 'us-east-1';
        if (localStorage.getItem('region')) {
            defaultRegion = localStorage.getItem('region');
        }
        var regions = JSON.parse(data);
        var parentEl = document.getElementsByClassName("region-select")[0];
        for (r of regions) {
            var el = document.createElement("option");
            el.innerText = r.name;
            el.setAttribute("value", r.region);
            if (defaultRegion === r.region) {
                el.setAttribute('selected', '');
            }
            parentEl.append(el);
        }
    });


// Service List init
getJSON("data/services.json")
    .then(data => {
        var services = JSON.parse(data);
        var history = JSON.parse(localStorage.getItem('service'));
        var engine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: services,
        });

        $('#bloodhound .service-select').typeahead({
            hint: true,
            highlight: true,
            minLength: 0
        },
            {
                name: 'name',
                display: 'name',
                source: servicesWithDefaults,
                templates: {
                    empty: '<p class="m-2">No results found</p>',
                    suggestion: function (data) {
                        var imgpath = `../assets/${data.name.replaceAll(' ', '').trim()}.png`;
                        return `<div class="m-1"><img class="aws-icons mr-4" src="${imgpath}">${data.name}</div>`;
                    }
                }
            }
        );

        function servicesWithDefaults(q, sync) {
            if (q.length > 0) {
                return engine.search(q, sync);
            }
            if (!history) {
                return sync(engine.all());
            } else {
                // return all data in saved item
                return sync(
                    new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        local: history
                    }).all());
            }
        }


        document.getElementById("form").addEventListener("submit", event => {
            var sname = event.target.elements.namedItem('service-name').value;
            var surl = '';
            var cnt = 0;
            var region = document.getElementsByClassName('region-select')[0].value
            while (cnt < services.length) {
                if (services[cnt].name === sname) {
                    surl = services[cnt].url
                    chrome.runtime.sendMessage({ type: 'open', url: surl, region: region }, (res) => {
                        // Save in local storage
                        if (res.status === 'ok') {
                            if (history) {
                                // cut off when history data is too long
                                if (history.length > 100) {
                                    history = history.splice(0, 100);
                                }
                                localStorage.setItem('region', region);
                                localStorage.setItem('service', JSON.stringify([{ name: sname, url: surl }].concat(history)));
                                return;
                            } else {
                                localStorage.setItem('region', region);
                                localStorage.setItem('service', JSON.stringify({ name: sname, url: surl }));
                                return;
                            }
                        }
                    });
                    break;
                }
                cnt++
            }


        });


    });


// autofocus
$(document).ready(function () {
    $('input:visible').eq(1).select();
    $('input:visible').eq(1).focus();
});


function getJSON(filename) {
    return new Promise(function (r) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', chrome.extension.getURL(filename), true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                r(xhr.responseText);
            }
        };
        xhr.send();
    });
}