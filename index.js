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

const getNotIndexedPages = (sitemap, stats) => {
    return sitemap.filter(url => ! stats.filter(stat => parseString(stat.page).includes(parseString(url))).length)
}

const getIndexedPages = (sitemap, stats) => {    
    return stats.filter(stat => {
        return sitemap.filter(url => parseString(stat.page).includes(parseString(url))).length;
    })
}

const getNotPerformedPages = (stats, media) => {
    return stats.filter(stat => Math.round(stat.hits.reduce((a, b) => a + b.views, 0)) <= media)
}

const getBestPages = (stats, media) => {
    return stats.filter(stat => Math.round(stat.hits.reduce((a, b) => a + b.views, 0)) >= media)
}

const transformPages = (stat, totalViews) => {
    const views = stat.hits.reduce((a, b) => a + b.views, 0);
    return {
        page: stat.page,
        views: views,
        // index: (views / totalViews) * 100
    }
}

// const compareRowsToSitemap = (sitemap, stats) => {
//     const totalViews = stats.map(stat => stat.hits.reduce((a, b) => a + b.views, 0)).reduce((a, b) => a + b, 0);
//     return {
//         not_indexed: sitemap.filter(url => ! stats.filter(stat => parseString(stat.page).includes(parseString(url))).length),
//         not_performed: sitemap.filter(url => stats.filter(stat => {
//             return parseString(stat.page).includes(parseString(url)) && stat.hits.reduce((a, b) => a + b.views, 0) <= process.env.MIN_VIEWS
//         }).length)
//     }
// }

const compareRowsToSitemap = (sitemap, stats) => {
    const totalViews = stats.map(stat => stat.hits.reduce((a, b) => a + b.views, 0)).reduce((a, b) => a + b, 0);
    const media = Math.round(totalViews / stats.length);
    const statsInSitemap = getIndexedPages(sitemap, stats);
    return {
        not_indexed: getNotIndexedPages(sitemap, stats),
        not_performed: getNotPerformedPages(statsInSitemap, media).map(x => transformPages(x, totalViews)),
        best: getBestPages(statsInSitemap, media).map(x => transformPages(x, totalViews))
    }
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
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/not_indexed_2.json', res, {spaces: 2}))
.subscribe(console.log, console.log)