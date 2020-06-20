const CryptoJS = require("crypto-js")

const Sequence = require('futures').sequence

const platform = require('../../../../utils/platform')

const fs = require('fs')

const currentPlatform = platform.get

exports.api = function (req, res) {
    if(typeof req.body.nonce !== "undefined") {
        if( req.body.nonce === process.env.PASSMAN_FORM_TOKEN ) {

            // this variable is generated by ./passman.js
            const filename = 'public.keyfile'
            const public_key_file = `${process.env.PASSMAN_USER_DIR}${filename}`

            fs.access(public_key_file, fs.constants.F_OK, (err) => {
                if ( err ) {
                    res.json({ status: false, msg: 'Security key does not exists, create a new key using key button.' })
                } else {
                    // if security key exists

                    // lets check the mode
                    let mode = req.body.mode

                    let title = req.body.title
                    let description = req.body.description
                    let password = req.body.password
                    let image = req.body.image

                    let data = {
                        'title': title,
                        'description': description,
                        'password': password,
                    }

                    const encrypt = require('../../../../utils/encrypt')

                    let enc = new encrypt(currentPlatform)

                    // removes current encrypted image.
                    if(mode === 'edit') {
                        let current = decodeURIComponent(req.body.currentEntry)

                        // all the images are stored here
                        const image_path = `${process.env.PASSMAN_USER_DIR}`;

                        let image = `${image_path}${current}`

                        fs.access(image, fs.constants.F_OK, (err) => {
                            if (err) {
                                // does not exists
                            } else {
                                // exists, remove it and move ahead with normal process
                                fs.unlinkSync(image)
                            }
                        })
                    }

                    // if image is not uploaded
                    // that means user has internet connection
                    // lets download image
                    if (image === '') {
                        const imgCls = require('../../../../utils/image')

                        const img = new imgCls()

                        Sequence()
                            .then(function(next) {
                                img.getRandomImage()
                                    .when(function(imgErr, imgData) {
                                        // random downloaded image
                                        let tmpImg = imgData

                                        enc.encryption(data, tmpImg)
                                            .when(function(err, data) {
                                                // lets remove temporary file
                                                fs.unlink(tmpImg, function() {
                                                    res.json({ status: true, file: data })
                                                })
                                            })
                                    })
                            })
                    } else {
                        // user do not have internet
                        // he has uploaded images from his pc
                        Sequence()
                            .then(function(next) {
                                enc.encryption(data, image)
                                    .when(function(err, data) {
                                        res.json({ status: true, file: data })
                                    })
                            })
                    }
                }
            })
        } else {
            // invalid nonce.
            res.send(401).send('Security breach, Invalid nonce detacted.')
        }
    } else {
        // nonce is not passed.
        res.send(401).send('Security breach, No security nonce found.')
    }
}