var m = {
    "Streaming": [
        "Netflix",
        "HBO",
        "Disney+"
    ],
    "Innovation": [
        "Apple",
        "Microsoft",
        "BMW"
    ],
    "Car": [
        "Tesla",
        "Porsche",
        "BMW",
        "Mercedes"
    ],
    "Stock": [
        "BMW",
        "Apple",
        "Microsoft",
        "Netflix",
        "Disney"
    ],
    "Disney": [
        "Disney+",
        "Mickey Mouse",
        "Animation",
        "Parks",
        "Resorts"
    ],
    "Animation": [
        "Mickey Mouse"
    ]
};

function reverseLookup(aMap, aTerm) {
    var res = Object.values(aMap).map(r => r.indexOf(aTerm) >= 0);

    var ar = {};
    for(var ii in res) {
        if (res[ii]) ar[Object.keys(aMap)[ii]] = reverseLookup(aMap, Object.keys(aMap)[ii]);
    }
    
    return ar;
}