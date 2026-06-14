import get from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/get/+esm"

const Plugin = videojs.getPlugin('plugin')

class VettaFiVideojsAnalytics extends Plugin {
  constructor(player, options) {
    super(player, options);

    this.eventCategory = 'Video'
    this.timesPlayed = 0
    this.percentage = 0
    this.percentInterval = 10
    this.timesEnded = 0

    player.on('ready', this.ready.bind(this))
    player.on('play', this.play.bind(this))
    player.on('pause', this.pause.bind(this))
    player.on('timeupdate', this.timeupdate.bind(this))
    player.on('ended', this.ended.bind(this))
    player.on('fullscreenchange', this.fullscreenchange.bind(this))
    player.on('error', this.error.bind(this))
    player.on('resize', this.resize.bind(this))
  }

  isSourceBlank() {
    return this.player.src().includes('blank.m4v')
  }

  source() {
    // If video comes from another Ad Manager, creativeID will be in the wrapper. If video comes from our DFP (we upload the MP4 ourselves) then the creativeID will in creatives[0]. If neither is found, send the video src to allow us to troubleshoot.

    const wrapperCreativeIds = []
    const creativeIds = []
    get(this.player, 'vast.vastResponse.ads', []).forEach(ad => {
      get(ad, 'inLine.extensions.extension', []).forEach(extension => {
        const id = get(extension, 'wrapperCreativeId.keyValue', false)
        if (id) wrapperCreativeIds.push(id)
      })

      get(ad, 'inLine.creatives', []).forEach(creative => {
        const id = get(creative, 'id', false)
        if (id) creativeIds.push(id)
      })
    })
    if (wrapperCreativeIds.length > 0) return `wrapperCreativeId:${wrapperCreativeIds.join(':')}`
    if (creativeIds.length > 0) return `creativeId:${creativeIds.join(':')}`

    return this.player.src()
  }

  trackEvent(action, value = null) {
    const name = this.source()
    window._paq = window._paq || []
    window._paq.push(['trackEvent', this.eventCategory, action, name, value])

    if (window.dataLayer) {
      Mitre.Analytics.trackEvent(this.eventCategory, action, name, value)
    }
  }

  ready() {
    this.trackEvent('ready')
  }

  play() {
    if (this.isSourceBlank()) return

    const currentTime = Math.round(this.player.currentTime())
    this.trackEvent('play', currentTime)

    if (this.timesPlayed === 0 && currentTime === 0) {
      this.trackEvent('started')
    }

    this.timesPlayed = this.timesPlayed + 1
  }

  pause() {
    this.trackEvent('pause', Math.round(this.player.currentTime()))
  }

  ended() {
    this.trackEvent('ended', Math.round(this.player.duration()))
    this.timesEnded = this.timesEnded + 1
  }

  fullscreenchange() {
    this.trackEvent('fullscreenchange', this.player.isFullscreen())
  }

  timeupdate() {
    const currentTime = this.player.currentTime()
    const duration = this.player.duration()
    const percentage = Math.round((currentTime / duration) * 100)

    if (this.percentage != percentage && percentage > 0 && percentage < 100 && (percentage % this.percentInterval) === 0) {
      this.trackEvent('percent_played', percentage)
    }

    this.percentage = percentage
  }

  error() {
    const errorObj = this.player.error()
    this.trackEvent('error', errorObj.message)
  }

  resize() {
    this.trackEvent('resize', `${this.player.width()} x ${this.player.height()}`)
  }
}

videojs.registerPlugin('analytics', VettaFiVideojsAnalytics)
;
