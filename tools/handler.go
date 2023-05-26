package tools

import (
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"
)

const (
	inputTime  = "02-01-2006"
	outputTime = "2006-01-02"
)

var (
	tpl        *template.Template
	artistsUrl string = "https://groupietrackers.herokuapp.com/api/artists"
)

func init() {
	tpl = template.Must(template.ParseGlob("templates/*.html"))
}

type datesLocations struct {
	Id             int `json:"id"`
	DatesLocations interface{}
}

type Artist struct {
	Id             int      `json:"id"`
	Image          string   `json:"image"`
	Name           string   `json:"name"`
	Members        []string `json:"members"`
	CreationDate   int      `json:"creationDate"`
	FirstAlbum     string   `json:"firstAlbum"`
	Locations      string   `json:"locations"`
	LocationsArr   []string `json:"locationsArr"`
	ConcertDates   string   `json:"ConcertDates"`
	Relations      string   `json:"relations"`
	DatesLocations interface{}
}
type Locatoin struct {
	Id        int      `json:"id"`
	Locations []string `json:"locations"`
	Dates     string   `json:"dates"`
}

var (
	client      *http.Client
	artistsList []Artist
)

func Server() {
	go GetAllArtists()

	http.HandleFunc("/", handler)
	http.HandleFunc("/artist", processor)

	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))

	log.Println("Starting a web server on http://localhost:8082/ ")
	err := http.ListenAndServe(":8082", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		Errors(w, http.StatusNotFound, "Not Found")
		return
	}
	if r.Method != "GET" {
		Errors(w, http.StatusMethodNotAllowed, "MethodNotAllowed")
		return
	}
	indexPage := struct {
		AristsList  []Artist `json:"artistsList"`
		SearchQuery string   `json:"searchQuery"`
	}{}
	// artistsList := GetAllArtists()
	indexPage.AristsList = artistsList
	searchQuery := r.FormValue("search-query")
	indexPage.SearchQuery = searchQuery
	tpl.ExecuteTemplate(w, "index.html", indexPage)
}

func locationsFill(i int, artist Artist) {
	var loc Locatoin
	err := GetJson(artist.Locations, &loc)
	if err != nil {
		fmt.Printf("Error geting artist's Locatoin:", err.Error())
		return
	}
	artistsList[i].LocationsArr = loc.Locations
}

func GetAllArtists() {
	// artistsList := []Artist{}
	err := GetJson(artistsUrl, &artistsList)
	if err != nil {
		fmt.Printf("Error geting artists list:", err.Error())
		return
	}

	for i, artist := range artistsList {
		tmp, _ := time.Parse(inputTime, artist.FirstAlbum)
		artistsList[i].FirstAlbum = tmp.Format(outputTime)
		go locationsFill(i, artist)
	}
	return
}

func GetJson(url string, target interface{}) error {
	client = &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return json.NewDecoder(resp.Body).Decode(target)
}

func GetArtist(id string) (Artist, error) {
	var artist Artist
	artistUrl := artistsUrl + "/" + id
	err := GetJson(artistUrl, &artist)
	if err != nil {
		fmt.Printf("Error geting artist page:", err.Error())
		return artist, err
	} else if artist.Id == 0 {
		return artist, errors.New("ARTIST NOT FOUND")
	}

	var dLocations datesLocations
	GetJson(artist.Relations, &dLocations)
	artist.DatesLocations = dLocations.DatesLocations
	return artist, nil
}

func processor(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/artist" {
		Errors(w, http.StatusNotFound, "Not Found")
		return
	}
	if r.Method != "GET" {
		Errors(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}
	id := r.FormValue("id")
	if id == "" {
		Errors(w, http.StatusBadRequest, "BadRequest")
		return
	}
	artist, err := GetArtist(id)
	if err != nil {
		Errors(w, http.StatusNotFound, "Not Found")
		return
	}
	artistPage := struct {
		Artist      Artist `json:"artist"`
		SearchQuery string `json:"searchQuery"`
	}{}
	// artistsList := GetAllArtists()
	artistPage.Artist = artist
	searchQuery := r.FormValue("search-query")
	artistPage.SearchQuery = searchQuery

	tpl.ExecuteTemplate(w, "artist.html", artistPage)
}

func Errors(w http.ResponseWriter, code int, message string) {
	w.WriteHeader(code)
	d := struct {
		ErrorCode int
		ErrorText string
	}{
		ErrorCode: code,
		ErrorText: message,
	}

	tpl.ExecuteTemplate(w, "error.html", d)
}
