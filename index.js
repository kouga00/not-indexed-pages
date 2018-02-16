'use strict';

require('dotenv').config({ silent: true });

const xml2js = new (require('xml2js')).Parser();
const gaApi = require('ga-api');
const rp = require('request-promise');
const Rx = require('rxjs');
const jsonfile = require('jsonfile');

const gaApiArgs = {
    clientId: process.env.CLIENT_ID,
    email: process.env.EMAIL,
    key: __dirname + process.env.KEY,
    ids: process.env.IDS,
    startDate: "2018-02-11",
    endDate: "2018-02-12",
    dimensions: "ga:pagePath, ga:date",
    metrics: "ga:pageviews",
    filters: "ga:medium==organic"
};

const transform = (stats) => stats.rows.reduce((a, c) => a.concat({ page: c[0], date: c[1], views: parseInt(c[2]) }), []).filter(x => x.views);

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

const compareRowsToSitemap = (sitemap, stats) => stats.filter(item => sitemap.indexOf(item.page) === -1);

const RxGaApi = (args) => Rx.Observable.bindNodeCallback(gaApi)(args).flatMap(transform);

// const RxGetOrganicAnalytics = RxGaApi(gaApiArgs)
// .expand(x => 
//     x.query && x.query['start-index'] ?
//     RxGaApi(Object.assign({}, {startIndex: x.query['start-index'] + 1000}, gaApiArgs)) :
//     Rx.Observable.empty()
// )
// .toArray()
// .flatMap(getUniquePages)
// .toArray()
// .flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./res.json', res, {spaces: 2}));


Rx.Observable.defer(() => rp('https://kingdomgame.it/post-sitemap1.xml'))
.flatMap(sitemap => Rx.Observable.bindNodeCallback(xml2js.parseString)(sitemap))
.map(sitemap => sitemap.urlset.url.map(x => x.loc[0].replace(/https?:[\/]{2}\S*?\/(\S*)/, '/$1')))
.flatMap(sitemap => Rx.Observable.bindNodeCallback(jsonfile.readFile)('./res.json'), (sitemap, stats) => compareRowsToSitemap(sitemap, stats))
.subscribe(console.log, console.log)











    
    // .then(xml => {
    //     xml2js.parseString(xml, (err, body) => {
    //         const siteMapUrls = body.urlset.url.map(x => x.loc[0].replace(/https?:[\/]{2}\S*?\/(\S*)/, '/$1'));
    //         gaApi({
    //             clientId: "618951284522-t7mpephtjlakto0uu7nh63pha8lcih7a.apps.googleusercontent.com",
    //             email: "prova-395@api-project-618951284522.iam.gserviceaccount.com",
    //             key: __dirname + "/key.pem",
    //             ids: "ga:66684775",
    //             startDate: "2017-11-01",
    //             endDate: "2018-02-12",
    //             dimensions: "ga:pagePath, ga:date",
    //             metrics: "ga:pageviews"
                
    //           }, (e, stats) => {
    //             const rows = stats.rows.reduce((a, c) => {
    //                 return a.concat({ page: c[0], date: c[1], views: parseInt(c[2]) });
    //             }, []).filter(x => x.views);
    //             const unique = Array.from(new Set(rows.map(x => x.page)))
    //             .map(page => rows.filter(x => x.page === page))
    //             .map(x => ({
    //                 page: x[0].page,
    //                 hits: x.map(v => ({
    //                     date: v.date,
    //                     views: v.views
    //                 }))
    //             }));
    //             const arr = unique.filter(item => siteMapUrls.indexOf(item.page) === -1);
    //             console.log(unique);
    //             console.log(arr.length);
    //           });
    //     })   
    // })
    // .catch(err => {
    // });
