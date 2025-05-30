A lot of the code was written while heavily caffeinated so I don't understand all of it. If there are any issues, please reach out to me. 

Anyways, this program is meant to geolocate approximate locations based on knowledge of time it takes to get to other places. For example, if it takes x minutes to drive to point A and y minutes to walk to point B, I can use this information to inference an approximate location (and since each returns a ring of uncertainties, the two points will return two possible places by SSA triangle congruence). 

To use for yourself, make an ORS API key and clone this repo. Have fun!
