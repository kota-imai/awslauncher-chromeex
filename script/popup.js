$('#searchbox').ready(() => {
  $('input:visible').eq(1).select(); // Move focus onto searchbox
  chrome.runtime.sendMessage({ type: 'set' }); // Send message to service worker
});


// Region Selector init
let targetRegion = 'us-east-1';
if (localStorage.getItem('region')) {
  targetRegion = localStorage.getItem('region');
}
const parentEl = document.getElementsByClassName("region-select")[0];
for (r of REGIONS) {
  const el = document.createElement("option");
  el.innerText = r.name;
  el.setAttribute("value", r.region);
  if (targetRegion === r.region) {
    el.setAttribute('selected', '');
  }
  parentEl.append(el);
}


// Flag to see whether a new tab has already been opened or not
let isOpened = 0;
// My definition of Bloodhound engine
const bhEngine = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('key', 'name'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  local: SERVICES,
});

$('#bloodhound .service-select').typeahead({
  hint: true,
  highlight: true,
  minLength: 0
},
  {
    name: 'name',
    display: 'name',
    limit: 10,
    source: allServices,
    templates: {
      empty: '<p class="my-2">No results found</p>',
      suggestion: (data) => {
        let imgpath = `../assets/${data.name.trim().replaceAll(' ', '')}.png`;
        let keywords = '';
        if (data.key) { 
          keywords = `<small><span class="badge badge-light font-weight-light">${data.key}</span></small>`
        }
        return `
          <div class="my-2">
            <div class="float-left">
              <img class="aws-icons mr-3" src="${imgpath}">
            </div>
            <span class="aws-service-name">${data.name}</span>
            ${keywords}
          </div>`;
      }
    }
  }).bind('typeahead:select', (ev, suggestion) => {
    if (isOpened > 0) return;
    openNewTab(suggestion.url, getSelectedRegion());

  }).bind('typeahead:close', () => {
    const query = getSearchboxText();
    bhEngine.initialize()
      .then(() => {
        bhEngine.search(query, (results) => {
          if (results.length === 0) return;
          if (isOpened > 0) return;
          openNewTab(results[0].url, getSelectedRegion());
        });
      });
  });

$('form').submit(() => {
  const query = getSearchboxText();
  if (query.length === 0) return;
  bhEngine.initialize()
    .then(() => {
      bhEngine.search(query, (results) => {
        if (results.length === 0) { 
          return false;
        } 
        if (isOpened > 0) return;
        openNewTab(results[0].url, getSelectedRegion());
        $( 'form' ).garlic( 'destroy' );
      });
    })
});

function allServices(q, sync) {
  if (q.length > 0) {
    return bhEngine.search(q, sync);
  }
  return sync(bhEngine.all());
}

function openNewTab(serviceUrl, region) {
  if (isOpened > 0) return;
  isOpened++;
  chrome.runtime.sendMessage({ type: 'open', url: serviceUrl, region: region }, (res) => {
    if (res.status === 'ok') {
      localStorage.setItem('region', region);
      return;
    }
  });
}

function getSelectedRegion() { 
  return document.getElementsByClassName('region-select')[0].value;
}

function getSearchboxText() { 
  return document.querySelector('#form > span > input.form-control.service-select.tt-input').value;
}