# tuneefy _2_

A new version of [tuneefy](http://tuneefy.com) built for PHP 7, from the ground up, using the minimal Slim framework and a few helper libraries.

### Installing

This project uses [composer](https://getcomposer.org/). Just run :

    composer install

### Creating tables

Tuneefy needs a variety of tables to work properly; you can populate your database with the following :

    mysql -u user -p database_name < ./structure.sql

### Building assets & API doc

To build the assets and the API documentation, I use **npm** and some modules.

    npm run build-assets
    npm run api-documentation

### Packages used

  - [Composer](https://getcomposer.org/), providing a nice package manager *and* a practical PSR-4 autoloader
  - [Symfony\Yaml](http://symfony.com/doc/current/components/yaml/introduction.html) to parse the configuration files
  - [Slim](http://www.slimframework.com/), a lightweight RESTful framework
  - [Twig](http://twig.sensiolabs.org/), a template engine
  - [XmlToJsonConverter](https://github.com/markwilson/xml-to-json) to convert Amazon XML to correct JSON
  - [RKA Content-Type renderer](https://github.com/akrabat/rka-content-type-renderer) to output JSON / XML / HTML for the API
  - [Aglio](https://github.com/danielgtaylor/aglio) for generating the API docs

### On the frontend side of things

I'm using [Zepto.js](http://zeptojs.com) to cover the DOM manipulation tasks and related stuff.

### Code structure

This project is a very basic composer project with a PSR-4 autoloader.
The source is in `src/tuneefy` and is organised as such :

  * **MusicalEntity** includes the model for a musical entity (_album or track_)
  * **Controller** includes the controllers for the various routes (api and frontend)
  * **Platform** includes all the platform-related code, especially the specific methods for each remote API call
  * **Utils** includes various utilities such as custom Slim error handlers
  * and two top-level classes : **Application** and **PlatformEngine** that deal with the application itself and how it interacts with the platforms

### Tests

The tests are under the `./tests` folder and I use **PHPUnit 6.1** to run them.
Just run :

    vendor/bin/phpunit -v

There should be 29 tests containing 599 assertions.

> Sometimes a platform fails to respond correctly due to network latencies or such. Re-run the tests in this case, it should pass fine the second time.

### API Documentation
(_This will move to somewhere more appropriate afterwards_)

#### Introduction

TBC

#### Apply for an API key

You can get an API key and associated secret by sending an email to api@tuneefy.com.

#### Authentication / Signature

You will need to authenticate in order to use the tuneefy API. All requests must be **signed** with **1-legged OAuth** (_often refered as 2-legged OAuth, but it's not_).

Here is a pseudo-code process on how to sign your requests :

> TBC

#### Web Service Rate Limits

Limits are placed on the number of API requests you may make using your API key. Rate limits may vary by service, but the defaults are 100 requests per hour.

#### Output format

Either pass `format=xml|json|html` or set the Accept header (prefered).

#### Lookup API

> TBC

#### Search API

> TBC

#### Aggregate API

> TBC

##### Merging aggressively

The `aggressive` parameter allows to merge tracks without taking the album name into account. This works for a majority of scenarios since it's quite rare that an artist released two tracks with exactly the same name, but it can sometimes confuse **live** or **edit** versions, for instance.

Acoustic versions, covers or remix should be correctly differentiated even if you merge aggressively.


- - -

> This is work in progress, but if you want to participate/contribute, feel free to tell me ! :)
