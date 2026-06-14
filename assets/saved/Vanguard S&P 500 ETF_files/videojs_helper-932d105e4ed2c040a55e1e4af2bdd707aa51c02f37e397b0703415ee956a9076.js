class VideojsHelper {
  constructor() {
    window.addEventListener('processYT', this.processYTEventHandler.bind(this));
  }

  processYTEventHandler(_event) {
    this.processYoutubeVideos(document);
  }

  processYoutubeVideos(parentNode) {
    var videos = this.findYoutubeVideos(parentNode);
    if (videos.length == 0) return;
    for (let index = 0, len = videos.length; index < len; ++index) {
      var videoObj = this.transformYoutubeElement(videos[index]);
      var videoElem = this.videojsElement(parentNode, videoObj);
      this.replaceYoutubeElement(videos[index], videoElem);
      videojs(videoObj.id).analytics()
    }
  };

  replaceYoutubeElement(youtubeElement, newElement) {
    const parent = youtubeElement.parentNode;
    youtubeElement.insertAdjacentElement('afterend', newElement);
    parent.removeChild(youtubeElement)
  };

  videojsElement(parent, videoObj) {
    var videoElem = parent.createElement('video');
    for (var prop in videoObj) {
      // if it's a boolean attribute, set blank as the value
      if (videoObj[prop] == true) {
        videoElem.setAttribute(prop, '');
      } else {
        videoElem.setAttribute(prop, videoObj[prop]);
      }
    }
    return videoElem;
  };

  transformYoutubeElement(element) {
    const url = element.getAttribute('src');
    const videoId = this.captureYoutubeVideoId(url);
    const dataSetup = {
      techOrder: ['youtube'],
      sources: [
        {
          type: 'video/youtube',
          src: 'https://www.youtube.com/watch?v=' + videoId
        }
      ]
    };
    const videoObj = {
      id: 'video-' + videoId,
      class: ['video-vjs', 'video-js', 'vjs-default-skin', 'vjs-fluid'].join(' '),
      controls: true,
      loop: true,
      'data-setup': JSON.stringify(dataSetup)
    };
    if (url.includes('autoplay')) {
      videoObj.autoplay = true;
      videoObj.muted = true;
    }
    return videoObj;
  };

  captureYoutubeVideoId(url) {
    const embedRegex = /\/embed\/([\w\-]+)/;
    const watchRegex = /\/watch\?v=([\w\-]+)/;
    const embedOk = embedRegex.exec(url);
    if (!embedOk) {
      const watchOk = watchRegex.exec(url);
      if (!watchOk) {
        return null;
      } else {
        return  watchOk[1];
      }
    } else {
      return embedOk[1];
    }
  };

  findYoutubeVideos(parentNode) {
    return Array.from(parentNode.querySelectorAll('iframe[src*="https://www.youtube.com"]:not(.vjs-tech)'));
  };
}

v = new VideojsHelper();
v.processYoutubeVideos(document);
