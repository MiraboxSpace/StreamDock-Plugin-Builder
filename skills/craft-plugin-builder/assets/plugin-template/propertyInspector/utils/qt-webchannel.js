(() => {
    let channelPromise;
    window.qtWebChannel = {
        qtObject: null,
        init() {
            if (channelPromise) return channelPromise;
            if (!window.qt?.webChannelTransport || typeof window.QWebChannel !== 'function') {
                return Promise.resolve(null);
            }
            channelPromise = new Promise((resolve, reject) => {
                try {
                    new window.QWebChannel(window.qt.webChannelTransport, channel => {
                        const qtObject = channel.objects.channelqtObject;
                        if (!qtObject) {
                            reject(new Error('Craft channelqtObject is unavailable'));
                            return;
                        }
                        this.qtObject = qtObject;
                        resolve(qtObject);
                    });
                } catch (error) {
                    reject(error);
                }
            }).catch(error => {
                channelPromise = undefined;
                console.error('Craft QWebChannel initialization failed', error);
                return null;
            });
            return channelPromise;
        }
    };
})();
