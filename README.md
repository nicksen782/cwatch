# Crypto Watcher (stand-alone)

## DESCRIPTION:
I wanted a list of charts for a list of crypto-currencies. I used the Coingecko API and their widgets but decided to make the charts myself instead of using their widgets. If you hover over a chart you will see change percentages over many ranges. Further, if you click on the chart you will open up the full chart on Coingecko.com. To add new crypto-currencies just add a new entry to the coinData.json file under 'keys' using the coingecko id for the new coin. The data key is managed by the program.

## INSTALL: 
````
git clone git@github.com:nicksen782/cwatch.git
cd cwatch
npm install
node index.js
````

## TESTED WITH:
- node v14.17.16
- node v16.14.0
- Windows, Debian/Ubuntu Linux