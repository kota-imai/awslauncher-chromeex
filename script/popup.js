// Region Selector init
var defaultRegion = 'us-east-1';
if (localStorage.getItem('region')) {
    defaultRegion = localStorage.getItem('region');
}
var parentEl = document.getElementsByClassName("region-select")[0];
for (r of REGIONS) {
    var el = document.createElement("option");
    el.innerText = r.name;
    el.setAttribute("value", r.region);
    if (defaultRegion === r.region) {
        el.setAttribute('selected', '');
    }
    parentEl.append(el);
}



// Resource List init
var opened = 0;
const services = RESOURCES;
const history = JSON.parse(localStorage.getItem('service'));
$('#bloodhound .service-select').typeahead({
    hint: true,
    highlight: true,
    minLength: 0
},
    {
        name: 'name',
        display: 'name',
        limit: 10,
        source: servicesWithDefaults,
        templates: {
            empty: '<p class="m-2">No results found</p>',
            suggestion: function (data) {
                var imgpath = `../assets/${data.name.trim().replaceAll(' ', '')}.png`;
                return `<div class="m-1"><img class="aws-icons mr-4" src="${imgpath}">${data.name}</div>`;
            }
        }
    }).bind('typeahead:select', function (ev, suggestion) {
        var region = document.getElementsByClassName('region-select')[0].value;
        if (opened > 0) return;
        openNewTab(suggestion.name, suggestion.url, region);
        opened++;

    }).bind('typeahead:close', function () {
        var query = document.querySelector('#form > span > input.form-control.service-select.tt-input').value;
        var engine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: services,
        });
        engine.initialize()
            .then(function () {
                engine.search(query, function (results) {
                    if (results.length === 0) return;
                    var region = document.getElementsByClassName('region-select')[0].value;
                    if (opened > 0) {
                        return;
                    }
                    openNewTab(results[0].name, results[0].url, region);
                    opened++;
                });
            });
    });

$('form').submit(function () {
    var query = document.querySelector('#form > span > input.form-control.service-select.tt-input').value;
    if (query.length === 0) return false;
    var engine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: services,
    });
    engine.initialize()
        .then(function () {
            engine.search(query, function (results) {
                if (results.length === 0) return false;
                var region = document.getElementsByClassName('region-select')[0].value;
                if (opened > 0) return false;
                openNewTab(results[0].name, results[0].url, region);
                opened++;
            });
        })
});


function servicesWithDefaults(q, sync) {
    var engine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: services,
    });
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

function openNewTab(serviceName, serviceUrl, region) {
    if (opened > 0) return;
    chrome.runtime.sendMessage({ type: 'open', url: serviceUrl, region: region }, (res) => {
        // Save in local storage
        if (res.status === 'ok') {
            opened++;
            if (history) {
                // cut off when history data is too long
                const maxLength = 50;
                if (history.length > maxLength) {
                    history = history.splice(0, maxLength);
                }
                localStorage.setItem('region', region);
                localStorage.setItem('service', JSON.stringify([{ name: serviceName, url: serviceUrl }].concat(history)));
                return;
            } else {
                localStorage.setItem('region', region);
                localStorage.setItem('service', JSON.stringify({ name: serviceName, url: serviceUrl }));
                return;
            }
        }
    });
}


// focus on searchbox
$('#searchbox').ready(function () {
    $('input:visible').eq(1).select();
});