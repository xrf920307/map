import React, { Component } from 'react';
import { compose, withProps } from "recompose";
import {withScriptjs, withGoogleMap, GoogleMap, Marker, Polyline } from "react-google-maps";
import MediaQuery from 'react-responsive';
import './App.css';
import Flexbox from 'flexbox-react';

const MyMapComponent =  compose(
  withProps({
    googleMapURL: "https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places",
    loadingElement: <div style={{ height: `100%`, width: `100%` }} />,
    containerElement: <div style={{ height: `100%`, width: `100%` }} />,
    mapElement: <div style={{ height: `100%`, width: `100%` }} />,
  }),
  withScriptjs,
  withGoogleMap
)((props) =>
  <GoogleMap
    defaultZoom={props.data.zoom}
    defaultCenter={props.data.center}
    onClick={props.click}
  >
    {/* {props.isMarkerShown &&  />} */}
    <Marker
        position={{lat: props.data.center.lat, lng: props.data.center.lng}}
        label={'You Are Here'}
        style={{color: '#fff'}}
      />
    {props.data.start.chosen ? <Marker
        position={{lat: props.data.start.lat, lng: props.data.start.lng}}
        label={'Start Point'}
    /> : null}
    {props.data.end.chosen ? <Marker
        position={{lat: props.data.end.lat, lng: props.data.end.lng}}
      label={'End Point'}
    /> : null}
    {props.data.isShowPloyline ? <Polyline
                      path={props.data.path}
                      geodesic={true}
                      options={{
                                strokeColor: 'green',
                                strokeOpacity: 0.5,
                                strokeWeight: 5,
                                icons: [{
                                          icon: null,
                                          offset: '0',
                                          repeat: '20px'
                                       }],
                              }}
                /> : null}
</GoogleMap>)

class App extends Component {
    state = {
      center: {
        lat: 22.372081,
        lng: 114.107877
      },
      isReady: false,
      isChooseStart: false,
      isChooseEnd: false,
      isShowPloyline: false,
      zoom: 15,
      start: {
          lat: null,
          lng: null,
          chosen: false
      },
      end: {
          lat: null,
          lng: null,
          chosen: false
      },
      path: null,
      routeInfo: null,
      errmsg: null,
    }
    componentWillMount(){
        navigator.geolocation.getCurrentPosition(this.success)
    }
    success = (position) => {
        this.setState({
            center:{
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            isReady: true
        })

    }
    clickMap = (e) => {
        if (this.state.isChooseStart) {
            this.setState({
                isChooseStart: false,
                isChooseEnd: false,
                start: {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                    chosen: true
                }
            })
            this.state.end.chosen ? this.getRoute() : null;
        }
        if (this.state.isChooseEnd) {
            this.setState({
                isChooseStart: false,
                isChooseEnd: false,
                end: {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                    chosen: true
                }
            })
            this.state.start.chosen ? this.getRoute() : null;
        }

    }
    chooseStart = (e) => {
        this.setState({
            isChooseStart: true
        })
    }
    chooseEnd = (e) => {
        this.setState({
            isChooseEnd: true
        })
    }
    presentAsStart = (e) => {
        this.setState({
            isChooseStart: false,
            isChooseEnd: false,
            start: {
                lat: this.state.center.lat,
                lng: this.state.center.lng,
                chosen: true
            }
        })
        console.log(this.state);
        this.state.end.chosen ? this.getRoute() : null;
    }
    presentAsEnd = (e) => {
        this.setState({
            isChooseStart: false,
            isChooseEnd: false,
            end: {
                lat: this.state.center.lat,
                lng: this.state.center.lng,
                chosen: true
            }
        });
        console.log(this.state);
        this.state.start.chosen ? this.getRoute() : null;
    }
    retryBtn = () => {
        this.getRoute()
    }
    async getRoute(){
        try {
            let response = await fetch('http://localhost:8080/route/', {
                method: "POST",
                mode: "cors",
                headers: new Headers({"Content-Type": "application/x-www-form-urlencoded", "charset" : "utf-8"}),
                body: [
                    [this.state.start.lat, this.state.start.lng],
                    [this.state.end.lat, this.state.end.lng],
                ],
            });
            let result = await response.json();
            console.log(result)

            try{
                let response_ = await fetch('http://localhost:8080/route/' + result.token, {
                    method: "GET",
                    mode: "cors",
                    headers: new Headers({"Content-Type": "application/x-www-form-urlencoded", "charset" : "utf-8"}),
                });
                let result_ = await response_.json();
                console.log(result_)
                let pathArray = [];
                result_.status === 'success' ? (
                    result_.path.map((item, index) => {
                        let tempObject = {lat: Number(item[0]), lng: Number(item[1])}
                        pathArray.push(tempObject);

                    }),
                    this.setState({
                        path: pathArray,
                        isShowPloyline: true,
                        routeInfo: {
                            distance: result_.total_distance,
                            time: result_.total_time
                        }
                    })
                ) : this.setState({
                    errmsg: result_.error ? result_.error : result_.status
                })


            } catch(ex){
                console.log(ex);
            }

        } catch (ex) {
            console.log(ex)
        }
    }


  render() {
    return (
        <div>
            <MediaQuery minWidth='770px'>
                <div style={{width: '100%', height: 'auto'}}>
                    <div style={{width: '100%', boxSizing: 'border-box', position: 'relative'}}>
                        <div style={{ height: '100vh', width: '70%', position: 'fixed'}}>
                            {this.state.isReady ?
                                <MyMapComponent isMarkerShown data={this.state} click={this.clickMap}/>: <div>loading</div>}
                        </div>
                        {
                            this.state.isReady ? <Flexbox justifyContent="center" flexDirection="column" style={{width: '30%', height: '100vh', background: '#efefef', boxSizing: 'border-box', padding: '3rem', position: 'absolute', right: 0}}>
                                <Flexbox flexDirection="column" justifyContent="space-between" alignItems="center">
                                    <Flexbox flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: '100%'}}>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.chooseStart}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Choose Start Point</span></button>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.chooseEnd}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Choose End Point</span></button>
                                    </Flexbox>
                                    {this.state.errmsg !== null ? <Flexbox flexDirection="column" style={{marginTop: '1rem'}}><Flexbox>{this.state.errmsg}</Flexbox><button style={{display: 'flex', width: '100%', height: '1.5rem'}} onClick={this.retryBtn}>Some error occur. Please click to Retry</button></Flexbox> : null}
                                    <Flexbox flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: '100%', marginTop: '2rem'}}>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.presentAsStart}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Use my position</span></button>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.presentAsEnd}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Use my position</span></button>
                                    </Flexbox>
                                </Flexbox>
                                {this.state.routeInfo === null ? null :
                                    <Flexbox flexDirection="column" justifyContent="center" alignItems="center">
                                        <Flexbox>
                                            Information
                                        </Flexbox>
                                        <Flexbox>
                                            distance: {this.state.routeInfo.distance}
                                        </Flexbox>
                                        <Flexbox>
                                            time: {this.state.routeInfo.time}
                                        </Flexbox>
                                    </Flexbox>
                                }
                            </Flexbox> : null
                        }
                    </div>
                </div>
            </MediaQuery>
            <MediaQuery maxWidth='770px'>
                <div style={{width: '100%', height: 'auto'}}>
                    <Flexbox flexDirection="column" justifyContent="center" alignItems="center" style={{width: '100%', boxSizing: 'border-box'}}>
                        <Flexbox style={{ height: '50vh', width: '100%'}}>
                            {this.state.isReady ?
                                <MyMapComponent isMarkerShown data={this.state} click={this.clickMap}/>: <Flexbox>loading</Flexbox>}
                        </Flexbox>
                        {
                            this.state.isReady ? <Flexbox justifyContent="center" flexDirection="column" style={{width: '100%', height: '50vh', background: '#efefef', boxSizing: 'border-box', padding: '3rem'}}>
                                <Flexbox flexDirection="column" justifyContent="space-between" alignItems="center">
                                    <Flexbox flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: '100%'}}>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.chooseStart}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Choose Start Point</span></button>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.chooseEnd}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Choose End Point</span></button>
                                    </Flexbox>
                                    {this.state.errmsg !== null ? <Flexbox flexDirection="column" style={{marginTop: '1rem'}}><Flexbox>{this.state.errmsg}</Flexbox><button style={{display: 'flex', width: '100%', height: '1.5rem'}} onClick={this.retryBtn}>Some error occur. Please click to Retry</button></Flexbox> : null}
                                    <Flexbox flexDirection="row" justifyContent="space-between" alignItems="center" style={{width: '100%', marginTop: '2rem'}}>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.presentAsStart}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Use my position</span></button>
                                        <button style={{display: 'flex', width: '40%', height: '2rem'}} onClick={this.presentAsEnd}><span style={{width: '100%', height: '100%', textAlign: 'center'}}>Use my position</span></button>
                                    </Flexbox>
                                </Flexbox>

                                {this.state.routeInfo === null ? null :
                                    <Flexbox flexDirection="column">
                                        <Flexbox>
                                            Information
                                        </Flexbox>
                                        <Flexbox>
                                            <span style={{textAlign: 'left'}}>distance: {this.state.routeInfo.distance}</span>
                                        </Flexbox>
                                        <Flexbox>
                                            <span style={{textAlign: 'left'}}>time: {this.state.routeInfo.time}</span>
                                        </Flexbox>
                                    </Flexbox>
                                }
                            </Flexbox> : null
                        }

                    </Flexbox>
                </div>
            </MediaQuery>
        </div>


    );
  }
}

export default App;
