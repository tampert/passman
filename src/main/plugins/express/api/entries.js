const path = require('path')

const Sequence = require('futures').sequence

const platform = require('../../../../utils/platform')

const currentPlatform = platform.get

exports.api = function (req, res) {
    if(typeof req.body.nonce !== "undefined") {
        if( req.body.nonce === process.env.PASSMAN_FORM_TOKEN ) {

            const fs = require('fs')

            // this variable is generated by ./passman.js
            const filename = 'public.keyfile'
            const public_key_file = `${process.env.PASSMAN_USER_DIR}${filename}`

            fs.access(public_key_file, fs.constants.F_OK, (err) => {
                if ( err ) {
                    res.json({ status: false, msg: 'Security key does not exists, create a new key using key button.' })
                } else {
                    // if security key exists.

                    // all the images are stored here
                    const image_path = `${process.env.PASSMAN_USER_DIR}`;

                    let entries = []

                    // lets read all the files
                    fs.readdir(image_path, function (err, files) {
                        //handling error
                        if (err) {
                            res.json({ status: false, msg: 'Unable to scan directory: ' + err })
                        }

                        files.forEach(function (file) {
                            if (file !== 'public.keyfile' && ( path.extname(file) ===  '.jpg' || path.extname(file) ===  '.jpeg' ) ) {
                                let content = {
                                    'file': file
                                }

                                entries.push(content)
                            }
                        })

                        res.json({ status: true, entries: entries })
                    })
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