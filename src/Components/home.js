import React, {useState, useEffect} from 'react';
import { Dropbox } from 'dropbox';
import { getThumbnails } from './getthumbnails'
import { Redirect } from "react-router-dom";
import {token$} from './store.js';
import ListItems from './listitems';
import CreateFolder from './createfolder';
import Search from './search';
import Breadcrumbs from './breadcrumbs';
import UploadFile from './uploadfile';
import UserAccount from './userAccount';
import { Helmet } from "react-helmet";
import LogOut from './logout'
import FavoriteList from "./favoriteList.js"
import {favorites$} from './store'
import {updateFavoriteToken} from './store'
import '../Css/home.css';



const Home = (props) => {
  const [token, updateTokenState] = useState(token$.value)
  const [data, updateData] = useState([]);
  const [thumbnails, updateThumbnails] = useState([])
  const [thumbnailsLoaded, updateThumbnailsLoaded] = useState(false);
  const [favorites, updateFavorites] = useState([]);
  const [oldData, updateOldData] = useState([])
  const [pollMode, updatePollMode] = useState(false)
  const [clearSearch, updateClearSearch] = useState(false)


  useEffect(() => {
    const subscription = favorites$.subscribe(updateFavorites);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {

    if (thumbnails.length === data.length) {
      const isLoaded = thumbnails.every((x, idx) => {
        return x[".tag"] === "failure" || x.metadata.id === data[idx].id;
      });

      updateThumbnailsLoaded(isLoaded);      
    } else {
      updateThumbnailsLoaded(false);
    }

  }, [data, thumbnails]);


    useEffect(() => {

     
      
       if(pollMode){
        return;
      }
        
      const poll = setInterval(() => {
        //console.log('Useffect körs')
        const option = {
          fetch: fetch,
          accessToken: token$.value
        };
        const dbx = new Dropbox(
          option,
        );

        
        if(props.location.pathname === '/home'){
          dbx.filesListFolder({
            path: '',
          
          })
          .then(response => {
           //updateOldData(data)
            
            let responseRev = response.entries.map(x => x.rev).filter(y => y !== undefined)
            let oldrespRev = oldData.map(x => x.rev).filter(y => y !== undefined)
            let responseName = response.entries.map(x => x.name).filter(y => y !== undefined)
            let oldrespName = oldData.map(x => x.name).filter(y => y !== undefined)

            const diffRev = responseRev.filter(el => !oldrespRev.includes(el));
            const diffName = responseName.filter(el => !oldrespName.includes(el))

            //Fullösning för att lösa fel i thumbnails när en mapp tas bort utifrån
             if(response.entries.length < oldData.length){
              
              updateThumbnails([])
              updateData(response.entries)
            }
            /* if(oldData.length < response.entries.length){
              console.log('poll körs root')
              updateData(response.entries)
            } */
           //console.log('Root mapp... Olddata ' + oldData.length)
           // console.log('Root mapp... response.entries ' + response.entries.length)

            if (response.entries.length !== oldData.length  || diffRev.length > 0 || diffName.length > 0){
              updatePollMode(true)
              console.log('poll körs root')
              console.log('poll stoppas tillfälligt root')
              
                getThumbnails(dbx, response.entries)

                .then(entries => {
                 
                  updateData(response.entries)
                  updateOldData(response.entries)
                  updateThumbnails(entries)
                  
                }) 
                .then(rep => {
                  updatePollMode(false)
                  console.log('Poll startar igen root')

                })
                .catch(function(error) {
                  console.log(error);
                 });
              

            }
            else{
              console.log('Poll har inte körts för root')
              return;
            }

          })
          
          .catch(function(error) {
            console.log(error);
           });
    
        }
        else{
          
          let newFolder = props.location.pathname;
          newFolder = newFolder.substring(5)
    
          dbx.filesListFolder({
            path: newFolder,
          
          })
          .then(response => {

            //updateOldData(response.entries)

            let responseRev = response.entries.map(x => x.rev).filter(y => y !== undefined)
            let oldrespRev = oldData.map(x => x.rev).filter(y => y !== undefined)
            let responseName = response.entries.map(x => x.name).filter(y => y !== undefined)
            let oldrespName = oldData.map(x => x.name).filter(y => y !== undefined)

            const diffRev = responseRev.filter(el => !oldrespRev.includes(el));
            const diffName = responseName.filter(el => !oldrespName.includes(el))


            /* if(oldData.length < response.entries.length){
              console.log('poll körs folder')
             
              updateData(response.entries)
              
            } */
            if(response.entries.length < oldData.length){
              
              updateThumbnails([])
              updateData(response.entries)
              
            }

            //console.log('Folder mapp... Olddata ' + oldData.length)
            //console.log('Folder mapp... Response.entries ' + response.entries.length)

            if(response.entries.length !== oldData.length || diffRev.length > 0 || diffName.length > 0){
              // testa stoppa pollning här tills alla filer är klara...
              updatePollMode(true)
              console.log('poll körs folder')
              console.log('poll stoppas tillfälligt folder')

              getThumbnails(dbx, response.entries)


               .then(entries => {
                updateData(response.entries)
                updateOldData(response.entries)
                updateThumbnails(entries)
                
              })
              .then(rep => {
                updatePollMode(false)
                console.log('Poll startar igen folder')
              })
              
              .catch(function(error) {
                console.log(error);
               });
              }
              else{
                console.log('Poll har inte körts för folder')
                return;
              }

          })
        
          .catch(function(error) {
            console.log(error);
           });
        }
      }, 5000);
      
      
    
    return () => clearInterval(poll);

    }, [data, oldData, props.location.pathname, pollMode]) 



    
  useEffect(() => {
    updatePollMode(true)
    console.log('render Home')
    const option = {
      fetch: fetch,
      accessToken: token$.value
    };
    const dbx = new Dropbox(
      option,
    );
    if(props.location.pathname === '/home'){
      dbx.filesListFolder({
        path: '',
      
      })
      .then(response => {
        
        console.log('bilder börjar hämtas')
          updateThumbnails([]);
          updateData(response.entries)
          updateOldData(response.entries)

        getThumbnails(dbx, response.entries)
        
        .then(entries => {   
          console.log('bilder klara')
            updateThumbnails(entries)
            
          })
          .catch(function(error) {
            console.log(error);
           });
           

      })
      
      .catch(function(error) {
        console.log(error);
       });

     
    }
    else{
      
      let newFolder = props.location.pathname;
      newFolder = newFolder.substring(5)

      dbx.filesListFolder({
        path: newFolder,
      
      })
      .then(response => {
        
        
        updateThumbnails([]);
        updateData(response.entries)
        updateOldData(response.entries)


        console.log(response.entries.length)
       console.log('bilder börjar hämtas')
        getThumbnails(dbx, response.entries)
        
      
          .then(entries => {   
            console.log('bilder klara')
            updateThumbnails(entries)
         
            })
            
            .catch(function(error) {
              if(error.response.status === 409){
                updateThumbnails([])
              }
             });

        
          
        
           
      })
      .catch(function(error) {
        console.log(error);
       });
    }
      clearSearchUpdate(false)
      updatePollMode(false)
  }, [props.location.pathname, clearSearch])


  const dataUpdate = (data) => {
    //updateOldData(data)
    updateData(data)
    
  }

  const thumbnailUpdate = (data) => {
    updateThumbnails(data)
  } 

  const oldDataUpdate = (data) => {
    updateOldData(data)
    
  }

  const favUpdate = (data) => {
    updateFavorites(data);
    updateFavoriteToken(data);
  }

  const pollUpdateMode = (bool) => {
      updatePollMode(bool)
  }
  const upFavTok = (arr) => {
    updateFavoriteToken(arr)
  }

  const clearSearchUpdate = (bool) => {
    updateClearSearch(bool)


    
  }

  if(token === null){
    return <Redirect to="/" />
  }
  
  return(
    <>
    <Helmet>
      <title>MyBOX</title>
    </Helmet>
    <header className="mainHeader">
      <div className="header-logo-wrap"><img id="header-logo" src={ require('../Img/Logo_mybox.png') } alt="My Box logo"/> </div>
        <span className="headerContent">
          <Search pollUpdateMode={pollUpdateMode} searchData={data} folder={props.location.pathname} dataUpdate={dataUpdate} thumbnailUpdate={thumbnailUpdate} oldDataUpdate={oldDataUpdate} clearSearch={clearSearch} clearSearchUpdate={clearSearchUpdate} />
          <span><UserAccount/></span>
          <span><LogOut updateTokenState={updateTokenState}/></span>
        </span>
    </header>
    <div className="mainWrapper">
      <aside className="leftSide">
        
        <div className="left-link-wrap"><UploadFile folder={props.location.pathname} dataUpdate={dataUpdate} thumbnailUpdate={thumbnailUpdate} oldDataUpdate={oldDataUpdate} pollUpdateMode={pollUpdateMode}></UploadFile><br></br><br></br>
        <CreateFolder folder={props.location.pathname} dataUpdate={dataUpdate} thumbnailUpdate={thumbnailUpdate} oldDataUpdate={oldDataUpdate} pollUpdateMode={pollUpdateMode}></CreateFolder></div>
      </aside>
      <main className="mainMain">
      <label onClick={() => updateClearSearch(true)}>
      <Breadcrumbs clearSearchUpdate={clearSearchUpdate}/><br /></label>
        <table className="mainTable">
          <thead>
            <tr className="home-thead-tr">
            <th colSpan="2">
              Name
            </th>
            <th>
              File size
            </th>
            <th>
              Last edited
            </th>
            <th style={{ textAlign: 'center' }}>
             Ren
            </th>
            <th style={{ textAlign: 'center' }}>
             Mov 
            </th>
            <th style={{ textAlign: 'center' }}>
             Cop
            </th>
            <th style={{ textAlign: 'center' }}>
              Fav
            </th>
            <th style={{ textAlign: 'center' }}>
              Del
            </th>
            </tr>
          </thead>
          <tbody>
            <ListItems favorites={favorites} favUpdate={favUpdate} thumbnailsLoaded={thumbnailsLoaded} folder={props.location.pathname} dataUpdate={dataUpdate} thumbnailUpdate={thumbnailUpdate} oldDataUpdate={oldDataUpdate} renderData={data} thumbnails={thumbnails} clearSearchUpdate={clearSearchUpdate} pollUpdateMode={pollUpdateMode}></ListItems>
          </tbody>
        </table>
      </main>
      <aside className="rightSide">
        <div className="aside"></div>
         <FavoriteList upFavTok={upFavTok} data={data} />
      </aside>
    </div>
    
    </>
  )
}

export default Home;



