'use strict';

require('dotenv').config({ silent: true });

const Rx = require('rxjs');
const gaApi = require('ga-api');
const jsonfile = require('jsonfile');

module.exports = class Utilities {

    static getAnalytics() {


        const gaApiArgs = {
            clientId: process.env.CLIENT_ID,
            email: process.env.EMAIL,
            key: process.env.PWD + process.env.KEY,
            ids: process.env.IDS,
            startDate: process.env.START_DATE,
            endDate: process.env.END_DATE,
            dimensions: process.env.DIMENSION,
            metrics: process.env.METRICS,
            filters: process.env.FILTERS
        };
    
        const RxGaApi = Rx.Observable.bindNodeCallback(gaApi);
    
        //GET ANALYTICS
        return RxGaApi(gaApiArgs)
        .expand(x => 
            x.rows ?
            RxGaApi(Object.assign({}, {startIndex: x.query['start-index'] + 1000}, gaApiArgs)) :
            Rx.Observable.empty()
        )
        .filter(x => x && x.rows)
        .flatMap(Utilities.transform)
        .toArray()
        .flatMap(Utilities.getUniquePages)
        .toArray()
        .flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)(process.env.PWD + process.env.FOLDER_DATA + '/analytics.json', res, {spaces: 2}))
        .flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)(process.env.PWD + process.env.FOLDER_DATA + '/analytics.json', { encoding: 'utf8' }))
    }

    static transform(stats) {
        return stats.rows
        .reduce((a, c) => a.concat({ page: c[0], date: c[1], views: parseInt(c[2]) }), [])
        .filter(x => x.views && x.page !== '/')
    }

    static getUniquePages(rows) {
        return Array.from(new Set(rows.map(x => x.page)))
        .map(page => rows.filter(x => x.page === page))
        .map(x => ({
            page: x[0].page,
            hits: x.map(v => ({
                date: v.date,
                views: v.views
            }))
        }))
    }

    static parseString(string) {
        return string.replace(/\/$/, '').split('/').pop();
    } 

    static getNotIndexedPages(sitemap, stats) {
        return sitemap.filter(url => ! stats.filter(stat => Utilities.parseString(stat.page).includes(Utilities.parseString(url))).length)
    }

    static getIndexedPages(sitemap, stats) {    
        return stats.filter(stat => sitemap.filter(url => Utilities.parseString(stat.page).includes(Utilities.parseString(url))).length)
    }

    static getNotPerformedPages(stats, media) {
        return stats.filter(stat => Math.round(stat.hits.reduce((a, b) => a + b.views, 0)) <= media)
    }

    static getBestPages(stats, media) {
        return stats.filter(stat => Math.round(stat.hits.reduce((a, b) => a + b.views, 0)) >= media)
    }

    static transformPages(stat, totalViews) {
        const views = stat.hits.reduce((a, b) => a + b.views, 0);
        return {
            page: stat.page,
            views: views,
            index: (views / totalViews) * 100
        }
    }

    static compareRowsToSitemap(sitemap, stats) {
        const totalViews = stats.map(stat => stat.hits.reduce((a, b) => a + b.views, 0)).reduce((a, b) => a + b, 0);
        const media = Math.round(totalViews / stats.length);
        const statsInSitemap = Utilities.getIndexedPages(sitemap, stats);
        return {
            not_indexed: Utilities.getNotIndexedPages(sitemap, stats),
            not_performed: Utilities.getNotPerformedPages(statsInSitemap, media).map(x => Utilities.transformPages(x, totalViews)),
            best: Utilities.getBestPages(statsInSitemap, media).map(x => Utilities.transformPages(x, totalViews))
        }
    }

}
