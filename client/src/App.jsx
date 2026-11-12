import React, { useState } from 'react';
import StreetScene from './components/StreetScene';
import CafeInterior from './components/CafeInterior';
import CafeRadio from './components/CafeRadio';
import ReadingCorner from './components/ReadingCorner';
import CafeMenu from './components/CafeMenu';
import BollywoodPosterWall from './components/BollywoodPosterWall';
import Bookshelf from './pages/Bookshelf';
import PanoramaViewer from './components/PanoramaViewer';
import { getPublicShelf } from './services/bookService';
import './book-nook.css';

export default function App(){
  const [place,setPlace]=useState('street');
  const [panorama,setPanorama]=useState(null);
  const [books,setBooks]=useState([]);
  const [radio,setRadio]=useState(null);
  const move=(where)=>{setPlace(where);if(where==='reading')getPublicShelf().then(result=>setBooks(result.data?.books||[])).catch(()=>setBooks([]));};
  return <div className="book-nook-app">
    <CafeRadio onControlsChange={setRadio}/>
    {panorama&&<PanoramaViewer scene={panorama} onClose={()=>setPanorama(null)} onChangeScene={next=>{move(next);setPanorama(next)}}/>}
    {!panorama&&place==='street'&&<StreetScene onEnter={()=>move('cafe')} onNavigate={move} on360={()=>setPanorama('street')}/>}
    {!panorama&&place==='cafe'&&<CafeInterior onBack={()=>move('street')} onNavigate={move} radio={radio} on360={()=>setPanorama('cafe')}/>}
    {place==='bookshelf'&&<Bookshelf onBack={()=>move('cafe')}/>}
    {place==='reading'&&<ReadingCorner books={books} onBack={()=>move('cafe')} onBrowse={()=>move('bookshelf')}/>}
    {place==='menu'&&<CafeMenu onBack={()=>move('cafe')}/>}
    {place==='posters'&&<BollywoodPosterWall onBack={()=>move('cafe')}/>}
  </div>;
}
