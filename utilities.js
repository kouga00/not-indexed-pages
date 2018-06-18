'use strict';

module.exports = class Utilities {

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
