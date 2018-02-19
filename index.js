'use strict';

require('dotenv').config({ silent: true });

const xml2js = new (require('xml2js')).Parser();
const gaApi = require('ga-api');
const rp = require('request-promise');
const Rx = require('rxjs');
const jsonfile = require('jsonfile');
const sitemapper = new (require('sitemapper'));

const gaApiArgs = {
    clientId: process.env.CLIENT_ID,
    email: process.env.EMAIL,
    key: __dirname + process.env.KEY,
    ids: process.env.IDS,
    startDate: "2012-01-01",
    // startDate: "2018-02-01",
    endDate: "2018-02-12",
    dimensions: "ga:pagePath, ga:date",
    metrics: "ga:pageviews",
    filters: "ga:medium==organic"
};

const transform = (stats) => {
    return stats.rows.reduce((a, c) => a.concat({ page: c[0], date: c[1], views: parseInt(c[2]) }), [])
    .filter(x => x.views && x.page !== '/');
}


const getUniquePages = (rows) =>
Array.from(new Set(rows.map(x => x.page)))
.map(page => rows.filter(x => x.page === page))
.map(x => ({
    page: x[0].page,
    hits: x.map(v => ({
        date: v.date,
        views: v.views
    }))
}))

const parseString = string => string.replace(/\/$/, '').split('/').pop();

const compareRowsToSitemap = (sitemap, stats) => {
    return sitemap.filter(url => ! stats.filter(stat => parseString(stat.page).includes(parseString(url))).length)
}

const RxGaApi = Rx.Observable.bindNodeCallback(gaApi);

// // GET ANALYTICS
// RxGaApi(gaApiArgs)
// .expand(x => 
//     x.rows ?
//     RxGaApi(Object.assign({}, {startIndex: x.query['start-index'] + 1000}, gaApiArgs)) :
//     Rx.Observable.empty()
// )
// .filter(x => x && x.rows)
// .flatMap(transform)
// .toArray()
// .flatMap(getUniquePages)
// .toArray()
// .flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/analytics.json', res, {spaces: 2}))
// .subscribe(console.log, console.log)


// // GET SITEMAPS
// Rx.Observable.defer(() => sitemapper.fetch('https://kingdomgame.it/sitemap_index.xml'))
// .map(res => res.sites.map(page => page.replace(/https?:[\/]{2}\S*?\/(\S*)/, '/$1')))
// .flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/sitemap.json', res, {spaces: 2}))
// .subscribe(console.log, console.log)


// // GET NOT INDEXED PAGES
Rx.Observable.bindNodeCallback(jsonfile.readFile)('./data/sitemap.json')
.flatMap(sitemap => Rx.Observable.bindNodeCallback(jsonfile.readFile)('./data/analytics.json'), (sitemap, stats) => compareRowsToSitemap(sitemap, stats))
.toArray()
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/not_indexed.json', res, {spaces: 2}))
.subscribe(console.log, console.log)