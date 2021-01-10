import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../imports/startup/validations";
import { Promise } from "meteor/promise";

import { Clues } from "../../imports/api/Clues";
import { Categories } from "../../imports/api/Categories";

export const ImportSets = new Mongo.Collection('import_sets');
export const Imports = new Mongo.Collection('imports', {idGeneration: 'MONGO'});

const CHAR_MAP = {'â‚¬': '€', 'â€š': '‚', 'Æ’': 'ƒ', 'â€ž': '„', 'â€¦': '…', 'â€¡': '‡', 'Ë†': 'ˆ', 'â€°': '%', 'â€¹': '‹', 'Å’': 'Œ', 'Å½': 'Ž', 'â€˜': '‘', 'â€™': '’', 'â€œ': '“', 'â€': '”', 'â€¢': '•', 'â€“': '–', 'â€”': '—', 'Ëœ': '˜', 'â„¢': '™', 'Å¡': 'š', 'â€º': '›', 'Å“': 'œ', 'Å¾': 'ž', 'Å¸': 'Ÿ', 'Â¡': '¡', 'Â¢': '¢', 'Â£': '£', 'Â¤': '¤', 'Â¥': '¥', 'Â¦': '¦', 'Â§': '§', 'Â¨': '¨', 'Â©': '©', 'Âª': 'ª', 'Â«': '«', 'Â¬': '¬', 'Â­': '­ ', 'Â®': '®', 'Â¯': '¯', 'Â°': '°', 'Â±': '±', 'Â²': '²', 'Â³': '³', 'Â´': '´', 'Âµ': 'µ', 'Â¶': '¶', 'Â·': '·', 'Â¸': '¸', 'Â¹': '¹', 'Âº': 'º', 'Â»': '»', 'Â¼': '¼', 'Â½': '½', 'Â¾': '¾', 'Â¿': '¿', 'Ã€': 'À', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä', 'Ã…': 'Å', 'Ã†': 'Æ', 'Ã‡': 'Ç', 'Ãˆ': 'È', 'Ã‰': 'É', 'ÃŠ': 'Ê', 'Ã‹': 'Ë', 'ÃŒ': 'Ì', 'ÃŽ': 'Î', 'Ã‘': 'Ñ', 'Ã’': 'Ò', 'Ã“': 'Ó', 'Ã”': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö', 'Ã—': '×', 'Ã˜': 'Ø', 'Ã™': 'Ù', 'Ãš': 'Ú', 'Ã›': 'Û', 'Ãœ': 'Ü', 'Ãž': 'Þ', 'ÃŸ': 'ß', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä', 'Ã¥': 'å', 'Ã¦': 'æ', 'Ã§': 'ç', 'Ã¨': 'è', 'Ã©': 'é', 'Ãª': 'ê', 'Ã«': 'ë', 'Ã¬': 'ì', 'Ã­': 'í', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã°': 'ð', 'Ã±': 'ñ', 'Ã²': 'ò', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö', 'Ã·': '÷', 'Ã¸': 'ø', 'Ã¹': 'ù', 'Ãº': 'ú', 'Ã»': 'û', 'Ã¼': 'ü', 'Ã½': 'ý', 'Ã¾': 'þ', 'Ã¿': 'ÿ', 'Å': 'Š', 'Â': ' ', 'Ã': 'Á'};

const SOURCES = {
    'OnThisDay.com': ['highlights', 'film-tv', 'music', 'sport'],
    'TimelinesDB.com': ['Abkhazia', 'Abortion', 'Abu Dhabi', 'Acadia', 'Accordion', 'Accounting', 'ACS', 'AdamsJ', 'AdamsJQ', 'Aden', 'Advertising', 'Afghan', 'Afghanistan', 'Africa', 'Agriculture', 'AI', 'AIDS', 'Air Crash', 'Air Force', 'Akkad', 'al-Qaida', 'Alabama', 'Alaska', 'Albania', 'Algeria', 'Amer. Samoa', 'AmerIndian', 'Anarchist', 'Andaman', 'Andorra', 'Angola', 'Anguilla', 'Animal', 'Antarctica', 'Anthrax', 'Anthropology', 'Antigua', 'Antilles', 'Antique', 'APEC', 'Aphorisms', 'AQAP', 'AQIM', 'Arab', 'Arab League', 'Aragon', 'Archeology', 'Architect', 'Arctic', 'Argentina', 'Arizona', 'ark', 'Arkansas', 'Armenia', 'ArthurC', 'Artist', 'Aruba', 'Ascension', 'ASEAN', 'Asia', 'Assassin', 'Assyria', 'Asteroid', 'Astrology', 'Astronomy', 'Atlantic Ocean', 'Atrocities', 'AU', 'Australia', 'Austria', 'Autism', 'Aviation', 'Azerbaijan', 'Azores', 'Aztec', 'Babies', 'Babylon', 'Bactria', 'Bahamas', 'Bahrain', 'Balkaria', 'Ballet', 'Balloon', 'Baltic Sea', 'Bangladesh', 'Banking', 'Bankruptcy', 'Baptists', 'Barbados', 'Baseball', 'Basketball', 'Basques', 'Bavaria', 'Beatles', 'Beer', 'Belarus', 'Belarus. Mad Crowd', 'Belgium', 'Belize', 'Belize China', 'Benin', 'Berber', 'Berbers', 'Bermuda', 'Bessarabia', 'Bhutan', 'Biafra', 'Bible', 'Bicycle', 'BidenJ', 'Big Bang', 'Big Money', 'Biography', 'Biology', 'BioTech', 'Bird Flu', 'Birds', 'Black History', 'Black Hole', 'Black Sea', 'BLM', 'Bluegrass', 'Blues', 'Bohemia', 'Bolivia', 'Bonaire', 'Books', 'Borneo', 'Bosnia', 'Botany', 'Botswana', 'Boxing', 'Brain', 'Brazil', 'BRICS', 'Britain', 'British Virgin Islands', 'Brunei', 'BuchananJ', 'Buddhism', 'Bulgaria', 'Burkina Faso', 'Burma', 'Burundi', 'Bus Crash', 'BushGW', 'BushHW', 'Byzantium', 'CAFTA', 'Calendar', 'California', 'Cambodia', 'Cameroon', 'Canada', 'Canary Islands', 'Cancer', 'Cannibal', 'Cape Verde', 'CAR', 'Caribbean', 'Caricom', 'Caroline Islands', 'Cars', 'CarterJ', 'Carthage', 'Cartoons', 'Caspian Sea', 'Cayman Islands', 'cecon', 'CELAC', 'Cello', 'Celts', 'Census', 'Central African Rep.', 'Ceramics', 'Ceres', 'Ceylon', 'Chad', 'Chagos Islands', 'Charity', 'Chechnya', 'Chemistry', 'Chess', 'Chicago', 'Chile', 'China', 'China Sex', 'Chocolate', 'CIA', 'Circassia', 'CIS', 'CITES', 'Civil War (US)', 'Classical Music', 'Clergy Sex', 'ClevelandG', 'ClintonB', 'ClintonH', 'Cocos Islands', 'Coffee', 'Cola', 'Colma', 'Colombia', 'Colombia. COVID-19', 'Colorado', 'Comedian', 'Comedy', 'Comet', 'Commonwealth', 'Comoros', 'Composer', 'Computer', 'Congo DRC', 'Congo Rep.', 'CongoDRC', 'Connecticut', 'Cook Islands', 'CoolidgeC', 'Coronavirus', 'Corp. Scandal', 'Corruption', 'Corsica', 'Cosmetics', 'Costa Rica', 'Council of Europe', 'COVID-1', 'COVID-19', 'COVID-19}', 'Crete', 'Crimea', 'Croatia', 'Crusades', 'Cuba', 'Cult', 'Curacao', 'Cybersecurity', 'Cyprus', 'Czech Rep.', 'Czech Republic', 'Czechoslovakia', 'Dacia', 'Dagestan', 'Dahomey', 'Daly City', 'Dance', 'DC', 'Death', 'Delaware', 'Denisovan', 'Denmark', 'Dental', 'Diamonds', 'Dinosaur', 'Disaster', 'DJIA', 'Djibouti', 'DNA', 'Dominica', 'Dominican Rep.', 'Dominican Republic', 'Donald Trump', 'Donation', 'Doomsday', 'Drought', 'Drugs', 'Drunk', 'Dubai', 'EAC', 'Earth', 'Earthquake', 'East Germany', 'East Timor', 'Ebola', 'ECJ', 'ECLAC', 'Eco-terror', 'Economics', 'ECOWAS', 'Ecuador', 'Education', 'EEU', 'Egypt', 'EisenhowerD', 'El Salvador', 'Emerald', 'England', 'Enron', 'Environment', 'EPA', 'Eq. Guinea', 'Equatorial Guinea', 'Eritrea', 'Espionage', 'Estonia', 'eSwatini', 'ETA', 'Ethiopia', 'Etruria', 'EU', 'Evolution', 'Explorer', 'Expo', 'Extinction', 'FAA', 'FACA', 'Fad', 'Falkland Islands', 'Famine', 'Faroe Islands', 'Fashion', 'FATCA', 'FBI', 'FCC', 'FDA', 'Fiji', 'FillmoreM', 'Film', 'Film Star', 'Filmstar', 'Finland', 'Fire', 'Fish', 'Flanders', 'Flood', 'Florence', 'Florida', 'Flute', 'Food', 'Football', 'FordG', 'France', 'FranklinB', 'Fraud', 'French Guiana', 'French Polynesia', 'Frogs', 'FTC', 'Furniture', 'Future', 'G20', 'G5', 'G5-Sahel', 'G6', 'G7', 'G8', 'Gabon', 'Galapagos Islands', 'Galicia', 'Gambia', 'Gambling', 'Games', 'GarfieldJ', 'Garifuna', 'Gas', 'Gays', 'GB', 'GCC', 'Genocide', 'Geology', 'Georgia', 'GeorgiaUS', 'Germany', 'Germany. Bird Flu', 'Ghana', 'Gibraltar', 'Gilbert Islands', 'Gitmo', 'Glass', 'GMO', 'God', 'God’s Will', 'Gold', 'Golf', 'Govm\'t Scandal', 'Govm\'t Scandal', 'Govm\'t. Scandal', 'GrantU', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea Bissau', 'Guinea-Bissau', 'Guns', 'Guyana', 'Gypsies', 'Hair', 'Haiti', 'HardingW', 'HarrisonB', 'HarrisonW', 'Hawaii', 'HayesR', 'Health', 'Heart', 'Hejaz', 'Heligoland', 'Hero', 'Hijacking', 'Hispaniola', 'Historian', 'HistoryBC', 'Hittites', 'HIV', 'Hoax', 'Hockey', 'Holiday', 'Holocaust', 'Holy Roman Empire', 'Homeless', 'Honduras', 'Hong Kong', 'HooverH', 'Horse', 'Horticulture', 'Hungary', 'Hurricane', 'IAAF', 'IAEA', 'ICC', 'Iceland', 'ICJ', 'Idaho', 'Identity', 'IEA', 'Illinois', 'Illinoism USA', 'Illyria', 'IMF', 'IN', 'Inca', 'India', 'Indiana', 'Indonesia', 'Indonesia. Flood', 'Ingushetia', 'Inquisition', 'Insects', 'Internet', 'Inuit', 'Inventor', 'Iowa', 'Iowa. Texas', 'IPO', 'Iran', 'Iran TV', 'Iraq', 'Iraq Syria', 'Ireland', 'IRS', 'Islam', 'Isle of Man', 'Isle of Wight', 'Israel', 'ISS', 'Italy', 'Ivory Coast', 'JacksonA', 'Jamaica', 'Japan', 'Jazz', 'JeffersonT', 'Jersey', 'Jews', 'JohnsonA', 'JohnsonL', 'Jordan', 'Journalism', 'Journalist', 'Jugband', 'Jumper', 'Jupiter', 'Kansas', 'Kansas3', 'Kashmir', 'Kazakhstan', 'KennedyJ', 'Kentucky', 'Kenya', 'Khazar', 'Kids', 'Kids. Religion', 'Kiribati', 'KKK', 'Knitting', 'Knowledge', 'Korea', 'Kosovo', 'Kurds', 'Kuwait', 'Kyrgyzstan', 'Labor', 'Land Mines', 'Language', 'Laos', 'Laos}', 'Latvia', 'Lawsuit', 'Lazica', 'Leadership', 'Lebanon', 'Leeward Islands', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'LincolnA', 'Liquor', 'Lithuania', 'Locusts', 'Lottery', 'Louisiana', 'Lute', 'Luxembourg', 'Lydia', 'Lynching', 'M&A', 'Macau', 'Macedonia', 'Macquarie', 'Mad Cow', 'Mad Crowd', 'Mad Man', 'Mad Police', 'Mad Woman', 'Madagascar', 'MadisonJ', 'Mafia', 'Magazine', 'Magic', 'Maine', 'Major Event', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Management', 'Manchuria', 'Maps', 'Marianas', 'Mars', 'Marshall Islands', 'Martinique', 'Maryland', 'Mass murder', 'Massachusetts', 'Massacre', 'Math', 'Matricide', 'Mauritania', 'Mauritius', 'Maya', 'Mayhem', 'McKinleyW', 'Media', 'Medical', 'Medicine', 'Mercosur', 'Mercury', 'Mesopotamia', 'Meteor', 'Mexico', 'Michigan', 'Microbiology', 'Micronesia', 'Midway Islands', 'Migrant', 'Migrant}', 'Military Amuck', 'Milky Way', 'Minnesota', 'Mississippi', 'Missouri', 'Moeny', 'Mold', 'Moldavia', 'Moldova', 'Molucca Islands', 'Monaco', 'Money', 'Mongolia', 'MonroeJ', 'Montana', 'Montenegro', 'Montserrat', 'Moon', 'Moravia', 'Morocco', 'Mountain', 'Mozambique', 'Murder', 'Murder. Teens Amuck', 'Museum', 'Museums', 'Music Instr.', 'Myanmar', 'NAACP', 'NAFTA', 'NAM', 'Namibia', 'NASA', 'Nasdaq', 'NATO', 'Nauru', 'Nazi', 'NCAA', 'Nebraska', 'Nepal', 'Neptune', 'Netherlands', 'Nevada', 'Nevis', 'New Caledonia', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'New Zealand', 'Nicaragua', 'Nieu', 'Niger', 'Nigeria', 'Nimby', 'Niue', 'NixonR', 'Nobel Prize', 'Norfolk Island', 'North Carolina', 'North Dakota', 'North Korea', 'North Macedonia', 'North Ossetia', 'Northern Ireland', 'Norway', 'Nuclear', 'NY', 'NYC', 'NYSE', 'OAS', 'ObamaB', 'OECD', 'Ohio', 'OIC', 'Oil', 'Oklahoma', 'Olmec', 'Olympics', 'Oman', 'OPCW', 'OPEC', 'Opera', 'Oregon', 'Orkneys', 'OSCE', 'Ossetia', 'OWS', 'Pacific Alliance', 'Pacific Ocean', 'Pacific Rim', 'Pageant', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Pandemic', 'Papua New Guinea', 'Paraguay', 'Patent', 'Patricide', 'Pennsylvania', 'Persia', 'Peru', 'Peru and St Lucia', 'Pharma', 'Philippines', 'Philippinesm Hurricane', 'Philistines', 'Philosophy', 'Phoenicians', 'Photography', 'Physics', 'Piano', 'PierceF', 'Pirate', 'Pirates', 'Pitcairn Island', 'Planet', 'Playwright', 'Pluto', 'Poet', 'Poland', 'Polio', 'PolkJ', 'Polynesia', 'Pop&Rock', 'Portugal', 'Postage', 'Primates', 'Prison Riot', 'Prosur', 'Proverb', 'Prussia', 'Psychiatry', 'Psychology', 'Puebla Group', 'Puerto Rico', 'Puntland', 'QAnon', 'Qatar', 'QC', 'Quote', 'Radio', 'Rape', 'ReaganR', 'Real Estate', 'Religion', 'Renaissance', 'Reptile', 'Retail', 'Reunion', 'Reuters', 'Rhode Island', 'Rhodesia', 'Robbery', 'Robot', 'Romania', 'Romania. COVID-19', 'Romans', 'RooseveltF', 'RooseveltT', 'Runners', 'Russia', 'Rwanda', 'SAARC', 'Saba', 'Saint', 'Saint Lucia', 'Saint-Pierre et Miquelon', 'Saipan', 'Sami', 'Samoa', 'San Jose', 'San Jose (CA)', 'San Marino', 'Sao Tome', 'Sarawak', 'Sardinia', 'Sark', 'SARS', 'Saturn', 'Saudi Arabia', 'Savoy', 'Scam', 'School Shooter', 'Sci-Fi', 'SCO', 'Scotland', 'Scouts', 'Scythians', 'SEATO', 'SEC', 'Senegal', 'Serbia', 'Sex', 'Seychelles', 'SF', 'SF Bay Area', 'Shark', 'Ship', 'Shoes', 'Siberia', 'Siberia. Fire', 'Sicily', 'Sierra Leone', 'Sikkim', 'Silesia', 'Singapore', 'Skating', 'Skiing', 'Slavery', 'Sleep', 'Slovakia', 'Slovenia', 'Smoking', 'Sniper', 'Soccer', 'Social Media', 'Social Security', 'Sociology', 'Software', 'Solomon Islands', 'Somalia', 'Somaliland', 'South Africa', 'South Carolina', 'South Dakota', 'South Korea', 'South Ossetia', 'South Sudan', 'Space', 'Spain', 'Sri Lanka', 'St. Barthelemy', 'St. Croix', 'St. Eustatius', 'St. Helena', 'St. Kitts & Nevis', 'St. Lucia', 'St. Maarten', 'St. Martin', 'St. Vincent', 'Stars', 'Stock Scandal', 'Stupid', 'Submarine', 'Sudan', 'Sufi', 'Suicide', 'Sumer', 'Summit', 'Sun', 'Superman', 'Supreme Court', 'Suriname', 'Swaziland', 'Sweden', 'Swimmer', 'Switzerland', 'Syria', 'TaftW', 'Tahiti', 'Taiwan', 'Tajikistan', 'Tanzania', 'Tasmania', 'Tatarstan', 'Taxes', 'TaylorZ', 'Tea', 'Technology', 'Teens Amuck', 'Telecom', 'Tennessee', 'Tennis', 'Terrorism', 'Texas', 'Thailand', 'Theater', 'Thrace', 'Tibet', 'Time', 'Timeline', 'Timor Leste', 'Timor-Leste', 'Titan', 'Togo', 'Tokelau', 'Tonga', 'Tornado', 'Toys', 'Tragedy', 'Train Crash', 'Transdniestria', 'Transjordan', 'Treasure', 'Trebizond', 'Trees', 'Trinidad and Tobago', 'Trinidad&Tobago', 'Tripoli', 'Tristan da Cunha', 'Tristan de Cunha', 'Troy', 'TrumanH', 'TrumpD', 'Tuareg', 'Tunisia', 'Tunnel', 'Turkey', 'Turkmenistan', 'Turks and Caicos', 'Tuva', 'Tuvalu', 'TV', 'UAE', 'UFO', 'Uganda', 'Uighur', 'UJN', 'Ukraine', 'Umayyad', 'UN', 'Unasur', 'Universe', 'Uranus', 'Uruguay', 'US Space Force', 'USA', 'USMCA', 'USSR', 'Utah', 'Uzbekistan', 'Vampire', 'Vanuatu', 'Vatican', 'Venezuela', 'Venice', 'Venus', 'Vermont', 'Vietnam', 'Vikings', 'Violin', 'Virgin Islands', 'Virginia', 'Visigoths', 'Volcano', 'Volcano Islands', 'Wal-Mart', 'Wales', 'Wallis & Futuna', 'Washington', 'WashingtonG', 'WeatherAfrica', 'WeatherAsia', 'WeatherCA', 'WeatherEU', 'WeatherME', 'WeatherNA', 'WeatherPac', 'WeatherSA', 'WeatherUS', 'WEF', 'Weights & Measures', 'West Indies', 'West Virginia', 'Western Sahara', 'Whacko', 'Whales', 'WHO', 'WilsonW', 'Windward & Leeward', 'Wine', 'Wisconsin', 'WMD', 'Women', 'World', 'World Bank', 'World Court', 'World Record', 'WPA', 'Wrestling', 'Writer', 'WSF', 'WTO', 'WWI', 'WWII', 'Wyoming', 'Xanadu', 'Yemen', 'Yemen}', 'Yugoslavia', 'Zaire', 'Zambia', 'Zanzibar', 'Zeitgeist', 'Zimbabwe'],
};

if (Meteor.isServer) {

    Meteor.methods({

        // Add import set
        'importer.addSet'(name, categoryId = null) {

            check(name, NonEmptyString);
            check(categoryId, Match.OneOf(RecordId, null));

            return ImportSets.insert({
                name: name,
                categoryId: categoryId,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

        },

        // Remove imports from set
        'importer.removeImports'(setId) {
            check(setId, RecordId);
            return Imports.remove({setId: setId});
        },

        // Delete import set
        'importer.removeSet'(id) {
            check(id, RecordId);
            return ImportSets.remove(id);
        },

        // Disable Set
        'importer.disableSet'(id) {
            check(id, RecordId);
            return ImportSets.update(id, {$set: {active: false}});
        },

        // Enable Set
        'importer.enableSet'(id) {
            check(id, RecordId);
            return ImportSets.update(id, {$set: {active: true}});
        },

        // Import queued sets
        'importer.importQueued'(chunkSize = 1000) {

            ImportSets.find({active: true}, {sort: {createdAt: 1}}).fetch().forEach(function(importSet) {
                Meteor.call('importer.import', importSet._id, chunkSize);
            });

        },

        // Purge duplicates in a set that exist in another set
        'importer.purgeDuplicates'(setId, deleteThreshold = .5, beginningThreshold = .9, reportThreshold = .3) {

            // We'll get one big output string so that we can write that to file
            let out = '';

            // Find dupes grouping by date + external ID
            const imports = Promise.await(
                Imports.rawCollection().aggregate(
                    [
                        {
                            $match : {setId: setId},
                        },
                        {
                            $group: {
                                _id: {date: "$date", externalId: "$externalId"},
                                count: {$sum: 1},
                                importIds: {$push: "$_id"},
                                descriptions: {$push: "$description"},
                                externalIds: {$push: "$externalId"},
                            }
                        },
                        {
                            $sort: {
                                date: 1,
                                externalId: 1,
                                createdAt: 1,
                                description: 1,
                            },
                        },
                        {
                            $match: {count: {$gt: 1}}
                        }
                    ],
                    {allowDiskUse: true}
                ).toArray()
            );

            Logger.log('Found ' + imports.length + ' groups of possible dupes.');

            // Loop through all groupings and save the dupes
            const ss = require('string-similarity');
            let dupes = [];
            imports.forEach(function(clue) {

                // Loop through clues and only consider ones with 70%+ similarity as a true duplicate
                const numClues = clue.count;
                for (let i = 0; i < numClues; ++i) {
                    for (let n = i+1; n < numClues; ++n) {
                        const percMatch = ss.compareTwoStrings(clue.descriptions[i], clue.descriptions[n]);
                        if (percMatch >= reportThreshold) {
                            const minLength = (clue.descriptions[i].length > clue.descriptions[n].length) ? clue.descriptions[n].length : clue.descriptions[i].length;
                            const beginningPercMatch = ss.compareTwoStrings(clue.descriptions[i].substr(0, minLength), clue.descriptions[n].substr(0, minLength));
                            dupes.push({
                                date: clue._id.date,
                                externalId: clue._id.externalId,
                                percMatch: percMatch,
                                beginningPercMatch: beginningPercMatch,
                                oldImportId: clue.importIds[i],
                                newImportId: clue.importIds[n],
                                oldDescription: clue.descriptions[i],
                                newDescription: clue.descriptions[n],
                            });
                            Logger.log('[' + (percMatch * 100).toFixed(2) + "%" + '] ' + clue.importIds[i] + ' vs ' + clue.importIds[n]);
                        }
                    }
                }

            });

            // Loop through dupes, update the old one, and delete the new one
            let removed = [];
            let notRemoved = [];
            let manualReview = [];
            let removedIds = [];
            dupes.forEach(function(dupe) {

                // If this dupe is above the delete threshold, or the beginning is above the beginning threshold similar, then delete the dupe
                if (
                    (dupe.percMatch >= deleteThreshold) ||
                    (dupe.beginningPercMatch >= beginningThreshold)
                ) {

                    // Get the newer import
                    let didRemove = false;
                    const oldImportId = new Mongo.ObjectID(dupe.oldImportId.toString());
                    const newImportId = new Mongo.ObjectID(dupe.newImportId.toString());
                    const newImport = Imports.findOne(newImportId);

                    // Set fields to update the old import with
                    if (newImport) {

                        const doc = _.pick(
                            newImport,
                            'description',
                            'hint',
                            'thumbnail',
                            'imageUrl',
                            'latitude',
                            'longitude',
                            'externalUrl',
                            'moreInfo'
                        );
                        doc.updatedAt = new Date();

                        // Update the old import and delete the new one
                        const didUpdate = Imports.update(oldImportId, {$set: doc});
                        if (didUpdate) {
                            removedIds.push(newImportId.valueOf());
                            didRemove = Imports.remove(newImportId);
                        }

                    }

                    // Add the clue to the appropriate list depending on the outcome of the removal of the new one
                    if (didRemove) {
                        removed.push(dupe);
                    } else {
                        notRemoved.push(dupe);
                    }

                // Otherwise just report for manual review
                } else {
                    manualReview.push(dupe);
                }

            });

            // Loop through the buckets and output accordingly
            const groups = [
                {title: "DUPLICATE CLUES REMOVED", dupes: removed},
                {title: "DUPLICATE CLUES COULD NOT BE REMOVED", dupes: notRemoved},
                {title: "POSSIBLE DUPLICATE CLUES FOR MANUAL REVIEW", dupes: manualReview},
            ];
            groups.forEach(function(group) {
                out += group.title + " (" + group.dupes.length + ")" + hr();
                group.dupes.forEach(function(dupe) {
                    const formattedPercMatch = (dupe.percMatch * 100).toFixed(2) + "%";
                    const formattedBeginningPercMatch = (dupe.beginningPercMatch * 100).toFixed(2) + "%";
                    out += dupe.date + " [" + dupe.externalId + "]: " + formattedPercMatch + " (" + formattedBeginningPercMatch + " beginning)\n";
                    out += "[" + dupe.oldImportId + "] " + dupe.oldDescription + "\n";
                    out += "[" + dupe.newImportId + "] " + dupe.newDescription + "\n";
                    out += "\n";
                });
                out += "\n";
            });

            // Add a list of dupe IDs that were deleted at the end in case we need to manually delete
            out += "REMOVED THE FOLLOWING IMPORTS (" + removedIds.length + ")" + hr() + JSON.stringify(removedIds) + "\n\n";

            // Output the logs to STDOUT + a log file
            Logger.log(out, 3);
            const fs = require('fs');
            const dir = process.cwd() + '/../../../../../out/';
            const file = dir + 'dedupe_' + setId + '_' + new Date().getTime() + '.txt';
            fs.writeFile(file, out, (err) => {
                if (err) {
                    Logger.log(err, 3);
                } else {
                    Logger.log("Results output to " + file);
                }
            });

        },

        // Import Clues
        'importer.import'(setId, chunkSize = 1000) {

            check(setId, RecordId);
            check(chunkSize, Match.Integer);

            // Set the filter criteria on which imports to operate on
            const importSelector = {
                setId: setId,
                $or: [
                    {lastImportedAt: null},
                    {lastImportedAt: {$exists: false}},
                    {$expr: {$gt: ["$updatedAt" , "$lastImportedAt"]}},
                ],
            };

            // Set basic chunking math
            const total = Imports.find(importSelector).count();
            if (total == 0) {
                Logger.log('No clues to import for set ' + setId + '. Aborting.', 3);
                return;
            } else {
                Logger.log('Found ' + total + ' new or updated clues to import for set ' + setId + '. Importing ...', 3);
            }
            const numChunks = Math.ceil(total / chunkSize);

            // Get the category ID to use for inserts
            const importSet = ImportSets.findOne(setId);
            const categoryId = importSet.categoryId;

            // Set
            const insertDoc = {
                categories: [categoryId],
                ownerId: null,
                active: true,
                open: false,
                score: Clues.DEFAULT_SCORE,
                difficulty: Clues.DEFAULT_DIFFICULTY,
                approximation: false,
                createdAt: new Date(),
            };

            // Loop through in chunks
            let inserted = [];
            let updated = [];
            let errors = [];
            for (let i = 0; i < numChunks; ++i) {

                const start = i * chunkSize;
                const imports = Imports.find(
                    importSelector,
                    {
                        sort: {date: 1, description: 1},
                        skip: start,
                        limit: chunkSize,
                    }
                );

                // If count is not reporting correctly, just add chunkSize to start
                let end = start + imports.count(true);
                if (start == end) {
                    end = start + chunkSize;
                }

                Logger.log("\nImporting " + (start+1) + " - " + end + " of " + total + hr(), 3);
                imports.fetch().forEach(function(clue) {

                    const doc = _.pick(
                        clue,
                        'date',
                        'description',
                        'hint',
                        'thumbnail',
                        'imageUrl',
                        'latitude',
                        'longitude',
                        'externalUrl',
                        'externalId',
                        'moreInfo',
                    );

                    // Make sure the description is less than 240 chars
                    doc.description = doc.description.trim();
                    if (doc.description.length > 240) {
                        if (!doc.moreInfo) {
                            doc.moreInfo = doc.description;
                        }
                        const lastPeriod = doc.description.lastIndexOf('.', 240);
                        if (lastPeriod === -1) {
                            const lastSpace = doc.description.lastIndexOf(' ', 236);
                            doc.description = doc.description.substr(0, lastSpace) + ' ...';
                        } else {
                            doc.description = doc.description.substr(0, lastPeriod);
                        }
                    }

                    // Figure out the date
                    if (typeof(doc.date) == 'string') {
                        const parts = doc.date.split("-");
                        const n = (parts.length > 3) ? 1 : 0;
                        const year = parseInt(parts[n]) * ((parts.length > 3) ? -1 : 1);
                        const month = parseInt(parts[n+1]) - 1;
                        const day = parseInt(parts[n+2]);
                        const date = new Date(year, month, day);
                        if ((year > 0) && (year < 100)) {
                            date.setFullYear(year);
                        }
                        doc.date = date;
                    }
                    doc.timeZone = Clues.DEFAULT_TIMEZONE;
                    doc.year = doc.date.getUTCFullYear();
                    doc.month = doc.date.getUTCMonth()+1;
                    doc.day = doc.date.getUTCDate();

                    // Sort out coordinates
                    doc.latitude = parseCoord(doc.latitude);
                    doc.longitude = parseCoord(doc.longitude);

                    // Set the import ID
                    doc.importId = clue._id.valueOf();

                    // Set updated at
                    doc.updatedAt = new Date();

                    // Get rid of 'null' strings
                    for (const attr in doc) {
                        if (
                            (typeof(doc[attr]) == 'string') &&
                            (
                                (doc[attr] == 'null') ||
                                (doc[attr].trim().length == 0)
                            )
                        ) {
                            doc[attr] = null;
                        }
                    }

                    // Try to import the clue
                    const result = Clues.direct.upsert({importId: doc.importId}, {$set: doc, $setOnInsert: insertDoc}, {validate: false, getAutoValues: false});

                    // Put the result in the correct bucket
                    const log = doc.date.getUTCFullYear() + '-' + (doc.date.getUTCMonth()+1) + '-' + doc.date.getUTCDate() + ' (' + doc.importId + '): ' + doc.description;
                    let action = null;
                    if (result) {

                        if (result.insertedId) {
                            inserted.push(log);
                            action = 'INSERT';
                        } else {
                            updated.push(log);
                            action = 'UPDATE';
                        }

                        const importTimestamped = Imports.update(clue._id, {$set: {lastImportedAt: new Date()}});
                        if (!importTimestamped) {
                            Logger.log('Import ' + doc.importId + ' could not be marked as imported!', 3);
                            return;
                        }

                    } else {
                        errors.push(log);
                        action = 'ERROR';
                    }

                    Logger.log('[' + action + '] ' + log, 3);

                });

            }

            // Update the clue count of the insert category
            const cluesCount = Clues.find({categories: categoryId, active: true}).count();
            Categories.update(categoryId, {$set: {cluesCount: cluesCount}});

            Logger.log("Imported Set: " + importSet._id + "\n", 3);

            // Send an email to notify of successful import
            const subject = Meteor.settings.public.app.name + " Import Successful: " + importSet.name;
            const email = Helpers.renderHtmlEmail({
                subject: subject,
                preview: subject,
                template: 'import',
                data: {
                    importSet: importSet,
                    category: Categories.findOne(categoryId),
                    numTotal: (inserted.length + updated.length),
                    numInserted: inserted.length,
                    numUpdated: updated.length,
                    errors: errors,
                },
            });
            Email.send({
                from: Meteor.settings.public.app.sendEmail,
                to: Meteor.settings.public.app.feedbackEmail,
                subject: subject,
                text: email.text,
                html: email.html,
            });

        },

        // Preview the next import
        'importer.preview'(setId) {

            check(setId, RecordId);

            // Get the imports that will be updated vs inserted
            const updates = Imports.find({
                setId: setId,
                lastImportedAt: {$ne: null},
                $expr: {$gt: ["$updatedAt" , "$lastImportedAt"]},
            });
            const inserts = Imports.find({
                setId: setId,
                $or: [
                    {lastImportedAt: null},
                    {lastImportedAt: {$exists: false}},
                ],
            });

            const total = updates.count() + inserts.count();
            Logger.log("TOTAL UPSERTS: " + total + " (" + updates.count() + " updates + " + inserts.count() + " inserts)\n");

            const groups = [
                {title: "UPDATES", imports: updates},
                {title: "INSERTS", imports: inserts},
            ];
            groups.forEach(function(group) {
                Logger.log(group.title + " (" + group.imports.count() + ")" + hr());
                group.imports.forEach(function(clue) {
                    Logger.log(clue.date + ": " + clue.description + " [" + clue._id.valueOf() + "]");
                });
                Logger.log("\n");
            });

        },

        'importer.fixEncodings'() {

            let $or = [];
            for (const key in CHAR_MAP) {
                $or.push({description: {$regex: key}});
                $or.push({moreInfo: {$regex: key}});
            }

            const clues = Imports.find({$or});
            Logger.log("Fixing " + clues.count() + " imports string encodings ...\n");
            clues.forEach(function(clue) {

                const fixedDescription = (clue.description) ? fixStrEncodings(clue.description) : null;
                const fixedMoreInfo = (clue.moreInfo) ? fixStrEncodings(clue.moreInfo) : null;
                Logger.log('Fix ' + clue._id + ':' + hr(true));
                Logger.log("Description: " + clue.description + " =>\n" + fixedDescription + "\n");
                Logger.log("More Info: " + clue.moreInfo + " =>\n" + fixedMoreInfo + "\n");

                const updated = Imports.update(
                    clue._id,
                    {
                        $set: {
                            description: fixedDescription,
                            moreInfo: fixedMoreInfo,
                            updateAt: new Date(),
                        }
                    }
                );
                if (!updated) {
                    Meteor.throw('import-not-updated', 'The import could not be updated.');
                }

            });

        },

        'importer.addSourceCategories'(source = null, categoryThreshold = 100) {

            check(source, Match.OneOf(null, String));

            let sources = {};
            if (source) {
                if (SOURCES[source]) {
                    sources[source] = SOURCES[source];
                } else {
                    Meteor.throw('source-does-not-exist', 'Source does not exist.');
                }
            } else {
                sources = SOURCES;
            }

            for (source in sources) {

                Logger.log(source + hr(), 3);
                const set = ImportSets.findOne({name: source});
                const setId = set._id;

                sources[source].forEach(function(category) {

                    Logger.log(category + ":", 3);
                    const tmpImports = Promise.await(
                        Imports.rawCollection().aggregate([
                            {
                                $match: {
                                    setId: setId,
                                    categories: {$regex: category}
                                },
                            },
                            {
                                $group: {
                                    _id: null,
                                    importCount: {$sum: 1},
                                    importIds: {$push: {$toString: "$_id"}},
                                }
                            },
                        ]).toArray()
                    );

                    // Only proceed if there were results
                    if (tmpImports.length > 0) {

                        const categoryImports = tmpImports[0];

                        Logger.log('-- Found ' + categoryImports.importCount + ' matching imports', 3);

                        // Only make it a category if there are more than 100 clues
                        if (categoryImports.importCount > categoryThreshold) {

                            const existingCategory = Categories.findOne({source: source, name: category});
                            let categoryId = null;
                            if (existingCategory) {
                                categoryId = existingCategory._id;
                                Logger.log('-- Category already exists: ' + categoryId, 3);
                            } else {
                                const doc = {
                                    name: category,
                                    theme: 'General',
                                    precision: Categories.DEFAULT_PRECISION,
                                    private: false,
                                    active: true,
                                    source: source,
                                    collaborators: [],
                                    cluesCount: 0,
                                    ownerId: Meteor.settings.users.admin,
                                };
                                categoryId = Categories.insert(doc, {validate: false, getAutoValues: false});
                                if (categoryId) {
                                    Logger.log('-- New category created: ' + categoryId, 3);
                                } else {
                                    Meteor.throw('category-not-created', 'Category could not be created. Aborting.')
                                }
                            }

                            // Add all matching clues to it
                            if (categoryId) {

                                // We'll need to chunk the updates so we don't run out of memory
                                const chunkSize = 1000;
                                const numChunks = Math.ceil(categoryImports.importCount / chunkSize);
                                let numClues = 0;
                                for (let i = 0; i < numChunks; ++i) {
                                    const start = i * chunkSize;
                                    const end = ((i+1) * chunkSize) - 1;
                                    const importIds = categoryImports.importIds.slice(start, end);
                                    Logger.log('-- Adding category to clues ' + (start+1) + ' - ' + (start + importIds.length + 1), 3);
                                    numClues += Clues.direct.update(
                                        {importId: {$in: importIds}},
                                        {$addToSet: {categories: categoryId}},
                                        {multi: true}
                                    );
                                }

                                const cluesCount = Clues.find({categories: categoryId, active: true}).count();
                                const updated = Categories.update(categoryId, {$set: {cluesCount: cluesCount}});
                                if (!updated) {
                                    throw new Meteor.Error('category-not-updated', 'Could not update clue count for a category.');
                                }

                                Logger.log('-- ' + numClues + ' clues updated', 3);

                            }

                        } else {
                            Logger.log('-- Not enough clues to create a category; skipping', 3);
                            Logger.log('-- Import IDs: ' + JSON.stringify(categoryImports.importIds), 3);
                        }

                    } else {
                        Logger.log('-- Not enough clues to create a category; skipping', 3);
                    }


                    Logger.log('', 3);

                });

            }

        },

    });

}

function parseCoord(coord) {
    const parsedCoord = parseFloat(coord);
    if (isNaN(coord) || isNaN(parsedCoord)) {
        return null;
    } else {
        return parsedCoord;
    }
}

function hr(noEndNewLine = false) {
    return "\n" + "-".repeat(64) + (noEndNewLine ? "" : "\n");
}

function fixStrEncodings(str) {
    for (const key in CHAR_MAP) {
        str = str.replace(new RegExp(key, 'g'), CHAR_MAP[key]);
    }
    return str;
}