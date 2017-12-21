'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

const NAME_ACTION = 'play_song';
const WELCOME_ACTION = 'input.welcome';
const SONG_TITLE_ARGUMENT = 'song_title';
const URL = 'https://www.dropbox.com/s/64187kityjoxamb/SampleAudio_0.4mb.mp3?dl=0';

const ssml = (template, ...inputs) => {
  // Generate the raw escaped string
  const raw = template.reduce((out, str, i) => i
    ? out + (
      inputs[i - 1]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    ) + str
    : str
  );
  // Trim out new lines at the start and end but keep indentation
  const trimmed = raw
    .replace(/^\s*\n(\s*)<speak>/, '$1<speak>')
    .replace(/<\/speak>\s+$/, '</speak>');
  // Remove extra indentation
  const lines = trimmed.split('\n');
  const indent = /^\s*/.exec(lines[0])[0];
  const match = new RegExp(`^${indent}`);
  return lines.map(line => line.replace(match, '')).join('\n');
};

const songUrls = {
  'example' : 'https://storage.googleapis.com/test-1-45224.appspot.com/doberman-pincher_daniel-simion.mp3',
  'silent night' : 'https://storage.googleapis.com/test-1-45224.appspot.com/doberman-pincher_daniel-simion.mp3'
};

const allTitles = Object.keys(songUrls);

const baseResponses = {
  songList: `Ask me to play ${allTitles.slice(0, allTitles.length - 1).join(', ')}, or ${allTitles[allTitles.length - 1]}.`
};

const completeResponses = {
  didNotUnderstand: `Sorry, I didnt understand you. ${baseResponses.songList}`,
  welcome: `Welcome to a little dose of holiday cheer! ${baseResponses.songList} `,
  /** @param {string} element */
  leadToExample: title => `Ok, I will play ${title}. ${songUrls[title]}`,
  playSong: title => `${songUrls[title]}`
};

let actionMap = new Map();
actionMap.set(NAME_ACTION, /** @param {DialogflowApp} app */ app => {
  var title = app.getArgument(SONG_TITLE_ARGUMENT);
  if (!title && (app.getRawInput().includes('Play') || app.getRawInput().includes('play')))
  {
    var tmp = app.getRawInput();
    var cutHere = tmp.indexOf(" ");
    title = tmp.slice(cutHere + 1, tmp.length);
  }    
  if (!title) {
    const richResponse = app.buildRichResponse()
      .addSimpleResponse(completeResponses.didNotUnderstand);
    return app.ask(richResponse);
  }
  if (allTitles.indexOf(title) == -1) {
    const richResponse = app.buildRichResponse()
      .addSimpleResponse(`I dont know the song ${title}. ${baseResponses.songList}`);
    return app.ask(richResponse);
  }
  const textToSpeech = '<speak>' +
    'Okay, here is  ' + title + '<break time="2" /> <audio src="' + songUrls[title] + '">file did not load</audio>' +
    '</speak>';
    app.tell(textToSpeech);
  });

actionMap.set(WELCOME_ACTION, /** @param {DialogflowApp} app */ app => {
  const richResponse = app.buildRichResponse()
    .addSimpleResponse(completeResponses.welcome);
  return app.ask(richResponse);
});

exports.test1 = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));
  app.handleRequest(actionMap);
});
