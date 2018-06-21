# Get all pages not indexed by Google

## Description

 This package compare your sitemap with your Google Analytics account to get all pages not indexed during a range of dates and returns JSON and CSV files with:

 * Not Indexed: site pages that not indexed in Google SERP
 * Not Performed: site pages that performed worse than a calculate media
 * Best: site pages that not performed bettern than a calculate media

## Before run

Create your private key ready from your Google APIs service account and convert it in a public `.pem` key with this command:

```
$ openssl pkcs12 -in key.p12 -nodes -nocerts > key.pem
```

Then, set all required data in `.env.example`:

* CLIENT_ID: your clientId of your Google APIs service account
* EMAIL: your email registered of your Google APIs service account
* KEY= path of your `.pem` key
* IDS: your Analytics ID
* START_DATE: start date to analyze
* END_DATE: end date to analyze
* SITEMAP_LINK: link of your sitemap
* FOLDER_DATA: path to save JSON data
* FOLDER_CSV: path to save CSV data

Then, transform `.env.example` to `.env` with:

```
$ mv .env.example .env
```

## Usage

Run `npm install` to install all the required dependencies and then run `npm run script` to run package.
