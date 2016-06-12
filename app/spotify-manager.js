import _ from 'lodash';
import Spotify from 'spotify-node-applescript';

import Song from './song';

const CURRENT_SONG_CACHE_LIFETIME = 5000;

class SpotifyManager {
  constructor() {
    this.currentSong = null;

    // A collection of recent songs played are stored so that we can ascertain if they have 
    // been guessed correctly already or not. Only a short list is maintained in case a song
    // is played again at a later time
    this.recentSongs = [];
  }

  getCurrentSong() {
    if (this.currentSong && this.currentSong.identified >= Date.now() - CURRENT_SONG_CACHE_LIFETIME) {
      return Promise.resolve(this.currentSong.song);
    }

    // Locally scope recent songs
    const recentSongs = this.recentSongs;

    const promise = new Promise((resolve, reject) => {
      Spotify.getTrack(function(err, track){
        if (err) {
          reject(err);
        }

        if (!track) {
          reject(new Error('Could not retrieve track details'));
        }

        // Check if the song is in the recent songs list
        let song = _.find(recentSongs, { id: track.id });
        if (song) {
          return resolve(song);
        }

        // Create a new song and add it to the recent songs list
        song = new Song(track);
        recentSongs.unshift(song);

        // Ensure the recent songs list never grows bigger than 3 songs
        if (recentSongs.length > 3) {
          recentSongs.pop();
        }

        resolve(song);
      });
    })

    promise.then((song) => {
      this.currentSong = {
        identified: Date.now(),
        song,
      };
    });

    return promise;
  }
}

export default new SpotifyManager();