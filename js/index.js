var artists = indexPage.artistsList
var searchQuery = indexPage.searchQuery
var membersLens = []
var isCreationDate = false
var fromCreationDate = 0
var toCreationDate = 0
var isAlbumDate = false
var fromAlbumDate = false
var toAlbumDate = false
const mapSearch = new Map();
var selectedMembersLens = new Array;
var mapSelectLocations = new Map();
var filteredArtists = artists;
var isFiltered = false
console.log(artists)
if (searchQuery && searchQuery != "") {
    $("#searchInput").val(searchQuery);
}

$(document).ready(function() {
    getMapSearch();
    getArtists();
    getMembersLens();
    getFliters();
    console.log(mapSelectLocations)
    $( "#searchForm" ).on( "submit", function( event ) {
        var inputValue = $('#searchInput').val(); // Input value
        const keyValuePairs = Array.from(mapSearch);
        $.each(keyValuePairs, function(index, pair) {
            const key = pair[0];
            const value = pair[1];
            if (key.toLowerCase().toLowerCase().includes(inputValue.toLowerCase())) {
                window.location.href = "/artist?id=" + value + "&search-query=" + inputValue
            }
        });
        setTimeout(function() {
            alert("Nothing found(")
        }, 500); // Change the delay time as needed
        
        event.preventDefault();
    });
    $( "#locationForm" ).on( "submit", function( event ) {
        getFilteredArtists()
        event.preventDefault();
    });
    

    $("#searchInput").on("input", getSearchList);


    $('.checkbox').change(function() {
        if(this.checked) {
            selectedMembersLens.push($(this).attr("data-id"));
        } else{
            selectedMembersLens.splice(selectedMembersLens.indexOf($(this).attr("data-id")), 1);  //deleting
        }
        getFilteredArtists();
        $('.checkbox').val(this.checked);
    });

    $('.date_creation').change(function() {
        if (document.getElementById("To_Date_Creation").value != "" && document.getElementById("From_Date_Creation").value != "") {
            isCreationDate = true
            console.log(document.getElementById("To_Date_Creation").value)
            fromCreationDate = parseInt(document.getElementById("From_Date_Creation").value.slice(0, 4))
            toCreationDate = parseInt(document.getElementById("To_Date_Creation").value.slice(0, 4))
            console.log(fromCreationDate, toCreationDate)
            getFilteredArtists()
            return
        } else {
            isCreationDate = false
        }
        getFilteredArtists()
    });


    $('.date_album').change(function() {
        if (document.getElementById("To_Date_Album").value != "" && document.getElementById("From_Date_Album").value != "") {
            isAlbumDate = true
            fromAlbumDate = document.getElementById("From_Date_Album").value
            toAlbumDate = document.getElementById("To_Date_Album").value
            getFilteredArtists()
            return
        } else {
            isAlbumDate = false
        }
        getFilteredArtists()
    });
    $("#locations").on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            alert()
        }
    });
});
function timeStamp(date) {
    return Date.parse(date);
    }
function filterByCreation() {
    if (isCreationDate) {
        var newFilteredArtists = Object.values(filteredArtists).filter(artist => artist.creationDate >= fromCreationDate && artist.creationDate <= toCreationDate)
        filteredArtists = newFilteredArtists
    }
}
function filterByAlbumDate() {
    if (isAlbumDate) {
        var newFilteredArtists = Object.values(filteredArtists).filter(artist => timeStamp(artist.firstAlbum) >= timeStamp(fromAlbumDate) && timeStamp(artist.firstAlbum) <= timeStamp(toAlbumDate))
        filteredArtists = newFilteredArtists
    }
}

function filterByMembers() {
    if (selectedMembersLens.length == 0) {
        filteredArtists = artists
        return
    }
    filteredArtists = []
    selectedMembersLens.forEach(function(selectedMembersLen) {
        var newFilteredArtists = Object.values(artists).filter(artist => artist.members.length == selectedMembersLen)
        filteredArtists = filteredArtists.concat(newFilteredArtists); 
    });
}

function filterByLocation() {
    if (document.getElementById("location").value == "") {
        return
    }
    var value = document.getElementById("location").value 
    var selectLocation = mapSelectLocations.get(value)
    var newFilteredArtists = filteredArtists.filter(artist => {
            const locationMatch = artist.locationsArr.some(location => {
            return location.includes(selectLocation);
        });
        return locationMatch;
    });
    filteredArtists = newFilteredArtists
    console.log(filteredArtists, "filtered location")
}


function getFliters() {
    if (membersLens.length > 0) {
        var membersFilterContent = ""
        membersLens.forEach(function(membersLens) {
            membersFilterContent += `<label class="container">`+membersLens+`
                <input class="checkbox" data-id="` + membersLens + `" type="checkbox">
                <span class="checkmark"></span>
            </label>`
        });
        document.getElementById("members").innerHTML = membersFilterContent;
    }
    if (mapSelectLocations.size > 0) {
        var selectLocationsContent = ""
        mapSelectLocations.forEach((value, key, map) => {
            selectLocationsContent += `<option value="`+ key +`">
            </option>`
        });
        document.getElementById("locations").innerHTML = selectLocationsContent;
    }
}

function getMembersLens() {
    artists.forEach(function(artist) {
        len = artist.members.length
        if(membersLens.indexOf(len) === -1) {
            membersLens.push(len);
        }
    })
    membersLens.sort()
}

function getMapSearch() {
    if (artists) {
        artists.forEach(function(artist) {
            mapSearch.set(artist.name + " - artist", artist.id)
            mapSearch.set(artist.firstAlbum + " - firstAlbum " + artist.name, artist.id)
            mapSearch.set(artist.creationDate + " - created " + artist.name, artist.id)
            $.each(artist.members, function(_, member) {
                mapSearch.set(member + " - member", artist.id)
            })
            $.each(artist.locationsArr, function(_, location) {
                let selectLocation = location.toUpperCase().replace('-', ' ').replace('_', '-').replace('_', '-')
                if (!mapSelectLocations.has(selectLocation)) {
                    mapSelectLocations.set(selectLocation,location)
                }
                mapSearch.set(location.toUpperCase().replace('-', ' ') + " - location", artist.id)
            })
        })
    }
}

function getArtists() {
    var content = "<ul>";
    let artistsList = artists
    if (artistsList) {
        for (let i=0; i < artistsList.length; i++) {
            let artist = artistsList[i]
            content += '<a href="/artist?id=' + artist.id + '"><img src="' + artist.image + '" class="images"></a>';
        }
    }
    content += "</ul>";
    document.getElementById("slideContainer").innerHTML = content;

    setTimeout(function() {
        $('#loader').fadeOut('slow');
    }, 2000); // Change the delay time as needed
}
function getFilteredArtists() {
    filterByMembers()
    filterByCreation()
    filterByAlbumDate()
    filterByLocation()
    artistsList = filteredArtists
    var content = "<ul>";
    if (artistsList) {
        for (let i=0; i < artistsList.length; i++) {
            let artist = artistsList[i]
            content += '<a href="/artist?id=' + artist.id + '"><img src="' + artist.image + '" class="images"></a>';
        }
    }
    content += "</ul>";
    document.getElementById("slideContainer").innerHTML = content;

    setTimeout(function() {
        $('#loader').fadeOut('slow');
    }, 2000); // Change the delay time as needed
}

function getSearchList() {
    var query = $("#searchInput").val();
    if (query.length > 50) {
        alert("input must have only 30 characters")
        input.value = input.value.slice(0, 50);
      }
    // Filter the array of artists based on the search query
    const filteredArtists = artists.filter(artist => {
        const artistMatch = artist.name.toLowerCase().includes(query.toLowerCase());
        const creationMatch = artist.creationDate.toString().toLowerCase().includes(query.toLowerCase());
        const firstAlbumMatch = artist.firstAlbum.toLowerCase().includes(query.toLowerCase());
        const memberMatch = artist.members.some(member => {
            return member.toLowerCase().includes(query.toLowerCase());
        });
        const locationMatch = artist.locationsArr.some(location => {
            return location.toLowerCase().includes(query.toLowerCase());
        });
        return artistMatch || creationMatch || firstAlbumMatch || memberMatch || locationMatch;
    });
    // Clear the datalist
    const searchOptions = $("#searchOptions");
    searchOptions.empty();

    // Append the filtered artists and members to the datalist
    $.each(filteredArtists, function(index, artist) {
        // Append the artist name as an option
        const artistOption = $("<option>").attr("data-id", artist.id).text(artist.name + " - artist");
        const firstAlbumOption = $("<option>").attr("data-id", artist.id).text(artist.firstAlbum + " - firstAlbum " + artist.name);
        const creationOption = $("<option>").attr("data-id", artist.id).text(artist.creationDate + " - created " + artist.name);
        searchOptions.append(artistOption);
        searchOptions.append(firstAlbumOption);
        searchOptions.append(creationOption);

        // Append each member as an option if it matches the input value
        $.each(artist.members, function(index, member) {
            if (member.toLowerCase().includes(query.toLowerCase())) {
                const memberOption = $("<option>").attr("data-id", artist.id).text(member + " - member");
                searchOptions.append(memberOption);
            }
        });
        $.each(artist.locationsArr, function(index, location) {
            if (location.toLowerCase().includes(query.toLowerCase())) {
                const locationOption = $("<option>").attr("data-id", artist.id).text(location.toUpperCase().replace('_', ' ') + " - location");
                searchOptions.append(locationOption);
            }
        });
    });
}
