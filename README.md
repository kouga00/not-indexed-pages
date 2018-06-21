# Get all pages not indexed by Google

## Description

 This package compare your sitemap with your Google Analytics account to get all pages not indexed during a range of dates and returns JSON and CSV files with:

 * Not Indexed: site pages that not indexed in Google SERP
 * Not Performed: site pages that performed worse than a calculate media
 * Best: site pages that not performed bettern than a calculate media

## Before run

Go to [Google’s Developers Console site](https://console.developers.google.com/) and create a new project.
Click on **Credentials** under the **APIs & Auth** section, and then on the **Create new Client ID** button. 
Under **Application Type** select **Service account** and click on the **Create Client ID** button. 
After a few seconds your newly created private key will be downloaded to your computer and a popup message telling you that the secret password to your file is, well, notasecret will be shown. Remember this password as we will need it later. 

Now, convert your private key in a public `.pem` key with this command:

```
$ openssl pkcs12 -in key.p12 -nodes -nocerts > key.pem
```

For more details, visit [fsjohnny's guide](https://medium.com/@fsjohnny/using-google-analytics-api-with-node-js-eb1f5af3375a).

Then, set all required data in `.env.example`:

* **CLIENT_ID**: your clientId of your Google APIs service account
* **EMAIL**: your email registered of your Google APIs service account
* **KEY**: path of your `.pem` key
* **IDS**: your Analytics ID
* **START_DATE**: start date to analyze
* **END_DATE**: end date to analyze
* **SITEMAP_LINK**: link of your sitemap
* **FOLDER_DATA**: path to save JSON data
* **FOLDER_CSV**: path to save CSV data

Then, transform `.env.example` to `.env` with:

```
$ mv .env.example .env
```

## Usage

Run `npm install` to install all the required dependencies and then run `npm run script` to run package.
