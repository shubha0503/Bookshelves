import React, { useCallback, useEffect, useRef, useState } from 'react';

const bollywoodSongs = [
  { id: 'WF0HJv-9S_4', title: 'Chura Liya Hai Tumne Jo Dil Ko', artist: 'Mohammed Rafi, Asha Bhosle' },
  { id: 'jXlNjZnnCgc', title: 'Oye Boy Charlie', artist: 'Rekha Bhardwaj, Shankar Mahadevan, Mohit Chauhan' },
  { id: 'U0EI7XFkkV4', title: 'Farak · Taare', artist: 'Farak' },
  { id: '8xg3vE8Ie_E', title: 'Love Story', artist: 'Taylor Swift' },
  { id: 'e1mOmdykmwI', title: 'I Think They Call This Love', artist: 'Elliot James Reay' }
];

export default function CafeRadio({ onControlsChange }) {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerMount = useRef(null);
  const musicPlayer = useRef(null);
  const selectedSongRef = useRef(null);
  const playerReadyRef = useRef(false);
  const playAfterReady = useRef(false);
  const musicPlayingRef = useRef(false);

  const updatePlaying = useCallback(playing => {
    musicPlayingRef.current = playing;
    setMusicPlaying(playing);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const createPlayer = () => {
      if (cancelled || !playerMount.current || musicPlayer.current || !window.YT?.Player) return;
      musicPlayer.current = new window.YT.Player(playerMount.current, {
        width: '200', height: '200', videoId: bollywoodSongs[0].id,
        playerVars: { autoplay: 0, controls: 0, playsinline: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: event => {
            event.target.getIframe().setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            playerReadyRef.current = true;
            setPlayerReady(true);
            if (playAfterReady.current && selectedSongRef.current) {
              event.target.loadVideoById(selectedSongRef.current.id);
              event.target.playVideo();
              playAfterReady.current = false;
            }
          },
          onStateChange: event => {
            if (event.data === window.YT.PlayerState.PLAYING) updatePlaying(true);
            if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) updatePlaying(false);
          },
          onError: () => updatePlaying(false)
        }
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        createPlayer();
      };
      let script = document.querySelector('script[data-youtube-iframe-api]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.youtubeIframeApi = 'true';
        document.body.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      musicPlayer.current?.destroy?.();
      musicPlayer.current = null;
      playerReadyRef.current = false;
    };
  }, [updatePlaying]);

  const tuneRandomSong = useCallback(() => {
    const choices = bollywoodSongs.filter(song => song.id !== selectedSongRef.current?.id);
    const song = choices[Math.floor(Math.random() * choices.length)];
    selectedSongRef.current = song;
    setSelectedSong(song);
    updatePlaying(false);
    if (playerReadyRef.current && musicPlayer.current) {
      musicPlayer.current.loadVideoById(song.id);
      musicPlayer.current.playVideo();
    } else {
      playAfterReady.current = true;
    }
  }, [updatePlaying]);

  const togglePlayback = useCallback(() => {
    if (!selectedSongRef.current) {
      tuneRandomSong();
      return;
    }
    if (musicPlayingRef.current) {
      musicPlayer.current?.pauseVideo?.();
      updatePlaying(false);
      return;
    }
    if (playerReadyRef.current && musicPlayer.current) musicPlayer.current.playVideo();
    else playAfterReady.current = true;
  }, [tuneRandomSong, updatePlaying]);

  const stopPlayback = useCallback(() => {
    playAfterReady.current = false;
    musicPlayer.current?.stopVideo?.();
    selectedSongRef.current = null;
    setSelectedSong(null);
    updatePlaying(false);
  }, [updatePlaying]);

  useEffect(() => {
    onControlsChange?.({ musicPlaying, selectedSong, playerReady, tuneRandomSong, togglePlayback, stopPlayback });
  }, [musicPlaying, onControlsChange, playerReady, selectedSong, stopPlayback, togglePlayback, tuneRandomSong]);

  return <>
    <div className="persistent-cafe-radio" aria-hidden="true"><div className="filmi-radio-player" ref={playerMount} /></div>
    <div className="cafe-radio-state" aria-live="polite" data-playing={musicPlaying} data-ready={playerReady} data-song={selectedSong?.title || ''} />
  </>;
}
