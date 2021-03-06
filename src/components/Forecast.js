import React from 'react'

import NProgress from 'nprogress'
import qs from 'qs'
import axios from 'axios'

import { Link, Redirect } from 'react-router-dom'
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'

import weatherIcons from '../icons.json'

import WeatherCard from './WeatherCard'
import ErrorMessage from './ErrorMessage'

const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const API_KEY = 'df4e03736c39bd4ff908e176104afde8'

export default class Forecast extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      search: null,
      cityName: null,
      cityCountry: null,
      forecast: [],
      loading: true,
      moreInfo: false,
      error: false
    }
  }

  componentWillMount(nextProps) {
    this.getQuery(this.props)
  }

  componentDidMount(prevProps) {
    NProgress.start()

    this.fetchForecast(this.state.search)
  }

  componentWillUpdate(nextProps) {
    if (this.props.location.search !== nextProps.location.search) {
      this.setState(
        {
          cityName: null,
          forecast: {},
          loading: true,
          moreInfo: false
        },
        this.getQuery(nextProps)
      )
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.search !== prevProps.location.search) {
      NProgress.start()

      let search = qs.parse(this.props.location.search.substring(1))
      if (search.q)
        this.setState({ search: search.q }, this.fetchForecast(search.q))
    }
  }

  getQuery = props => {
    let search = qs.parse(props.location.search.substring(1))

    if (search.q)
      this.setState({ search: search.q })
  }

  fetchForecast = (cityName) => {
    axios
      .get(BASE_URL + '/forecast/daily', {
        params: {
          q: cityName,
          type: 'like',
          units: 'metric',
          cnt: 7,
          APPID: API_KEY
        }
      })
      .then(res => {
        NProgress.done()

        // Add weather icon to each day
        let list = res.data.list.map(d => {
          let code = d.weather[0].id
          let icon = weatherIcons[code].icon

          if (!(code > 699 && code < 800) && !(code > 899 && code < 1000)) {
            icon = 'day-' + icon
          }

          d.weather[0].icon = 'wi wi-' + icon
          return d
        })

        this.setState({
          cityName: res.data.city.name,
          cityCountry: res.data.city.country,
          forecast: list,
          loading: false
        })
      })
      .catch(err => {
        NProgress.done()

        this.setState({
          error: true,
          loading: true
        })
      })
  }

  handleMoreInfo = e => {
    this.setState({ moreInfo: !this.state.moreInfo })

    e.target.innerText === 'got it'
      ? (e.target.innerText = 'not what you wanted?')
      : (e.target.innerText = 'got it')
  }

  render() {
    if (!this.state.search && this.state.search !== '') {
      return <Redirect to="/" />
    }

    return (
      <div>
        <div className="card">
          <div className="card-header">
            <p className="card-header-title">
              {this.state.cityName ? (
                <span>
                  Forecast for {this.state.cityName}, {this.state.cityCountry}
                  <em className="is-small unwanted">
                    <button className="link-button" onClick={this.handleMoreInfo}>
                      not what you wanted?
                    </button>
                  </em>
                </span>
              ) : (
                <span>Looking up {this.state.search}...</span>
              )}
            </p>
          </div>
          {this.state.moreInfo && (
            <CSSTransitionGroup
              transitionName="fade"
              transitionAppear={true}
              transitionAppearTimeout={500}
              transitionEnter={false}
              transitionLeave={false}
            >
              <div className="card-content content">
                <p>
                  The weather forecast requests are made to&nbsp;
                  <Link to="https://openweathermap.org/" target="_blank">
                    the Open Weather Map
                  </Link>
                  &nbsp;and in some cases entering just the name of a city can
                  get you an unexpected result. You can try typing the name of
                  the respective country after the city's name, like so:
                </p>
                <pre>San Francisco, United States </pre>
                <p>or</p>
                <pre>San Francisco, US</pre>
              </div>
            </CSSTransitionGroup>
          )}
          {this.state.loading && (
            <div className="card-content">
              <p>loading...</p>
            </div>
          )}
        </div>

        {!this.state.loading &&
          this.state.forecast.map(f => (
            <CSSTransitionGroup
              key={f.dt}
              transitionName="fade"
              transitionAppear={true}
              transitionAppearTimeout={500}
              transitionEnter={false}
              transitionLeave={false}
            >
              <WeatherCard forecast={f} />
            </CSSTransitionGroup>
          ))}
        {this.state.error && <ErrorMessage />}
      </div>
    )
  }
}
