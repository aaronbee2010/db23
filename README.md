# db23

Nitro.js API for downloading and validating accessions and markers from 23andMe's v3 endpoint, the documentation for which can be found here:

https://api.23andme.com/docs/reference

Currently, there are two endpoints for interacting with this program:

* `GET /api/v1/download` - Downloads all accessions and markers from 23andMe API
* `GET /api/v1/validate` - Validates downloaded files
