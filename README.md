**survey.js** is a JavaScript Survey Library. It is a modern way to add a survey to your website. It uses JSON for survey metadata and results.
[![Build Status](https://travis-ci.org/surveyjs/surveyjs.svg?branch=master)](https://travis-ci.org/surveyjs/surveyjs)

![alt tag](https://raw.githubusercontent.com/surveyjs/surveyjs/master/survey_product_feedback.gif)

##Getting started
[![Join the chat at https://gitter.im/surveyjs/surveyjs](https://badges.gitter.im/surveyjs/surveyjs.svg)](https://gitter.im/surveyjs/surveyjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) 

To find our more about the library go
* to the [surveyjs.org site](http://surveyjs.org) 
* explore the live [Examples](http://surveyjs.org/examples/) 
* and build a survey JSON using [Visual Editor](http://surveyjs.org/builder/)

Install the library using npm.

Angular2 version:
```
npm install survey-angular
```
jQuery version:
```
npm install survey-jquery
```
Knockout version:
```
npm install survey-knockout
```
React version:
```
npm install survey-react
```

Or dowload the latest version as zip file [Download](http://surveyjs.org/downloads/surveyjs.zip)

##Building survey.js from sources

To build library yourself:

 1. **Clone the repo from GitHub**  
	```
	git clone https://github.com/surveyjs/surveyjs.git
	cd surveyjs
	```

 2. **Acquire build dependencies.** Make sure you have [Node.js](http://nodejs.org/) installed on your workstation. This is only needed to _build_ surveyjs from sources.  
	```
	npm install -g karma-cli
	npm install
	```
	The first `npm` command sets up the popular [Gulp](http://gulpjs.com/) build tool. 
	The second `npm` command sets up the Typescript Definition Manager [Typings](https://github.com/typings/typings).

 3. **Build the library**
	```
	npm run build_prod
	```
	After that you should have the library at 'dist' directory.

 4. **Run unit tests**
	```
	karma start
	```
	This command will run unit tests usign [Karma](https://karma-runner.github.io/0.13/index.html)

##Create your own question type.
Explore the [example](https://github.com/surveyjs/surveyjs/tree/master/src/plugins) of adding a new question type into your survey library.

##License

MIT license - [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)


##Visual Editor
Visual Editor [site](http://editor.surveyjs.io)
Visual Editor sources are [here](https://github.com/surveyjs/editor)
