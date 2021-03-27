const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcfetch = require('bandcamp-fetch')

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)

const shuffleTracks = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const genresArray = (data) => {
    let genres = data.map(track => track.genre)
    let uniqueGenres = [...new Set(genres.filter(genre => genre != ""))]
    return uniqueGenres
}

const fetchTracks = async (city) => {
    const tagUrl = `https://bandcamp.com/tag/${city}`
    let data = []
    let genreList = []
    for (let i = 1; i < 21; i++) {
        const params = {
            page: i
        }
        await bcfetch.getReleasesByTag(tagUrl, params)
            .then(results => {
                console.log(results.items)
                for (let song of results.items) {
                    data.push({
                        genre: song.genre,
                        artist: song.artist.name,
                        artistURL: song.artist.url,
                        title: song.featuredTrack.name,
                        audioSrc: song.featuredTrack.streamUrl,
                        image: song.imageUrl,
                        albumName: song.name,
                        albumURL: song.url
                    })
                }
            }).then(() => {
                params.page = i
            })
    }
    shuffleTracks(data)
    genreList = genresArray(data)

    return { data, genreList }
}

const fetchArtist = async (album) => {
    let data = {}
    const albumUrl = album;

    const options = {
        albumImageFormat: 'art_app_large',
        artistImageFormat: 'bio_featured',
        includeRawData: false
    }

    await bcfetch.getAlbumInfo(albumUrl, options).then(results => {
        data = {
            artistName: results.artist.name,
            artistDescription: results.artist.description,
            artistLink: results.artist.url,
            artistImage: results.artist.imageUrl
        }
    }).then(() => {
        console.log(data)
    })
    return { data }
}

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// defining an endpoint to return all ads
app.get('/tracks/:city', async (req, res) => {
    res.json(await fetchTracks(req.params.city))
});

app.get('/artistInfo', async (req, res) => {
    res.json(await fetchArtist(req.body.albumUrl))
})

// starting the server
app.listen(3001, () => {
    console.log('listening on port 3001');
});