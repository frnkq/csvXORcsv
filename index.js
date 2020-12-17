var fs = require('fs');
var csv = require('fast-csv');
var path = require('path');
var _ = require('lodash');

const delimiter = ',';
const differences = [];
var arrs = [];

const dir = path.join(__dirname, 'csvs');
fs.readdir(dir, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    let csvs = files.filter(f => f.split('.').pop().includes('csv'));

    csvs.forEach(function (file) {
        let arr = [];
        fs.createReadStream('csvs/' + file)
            .pipe(csv.parse({ headers: true, delimiter: delimiter }))
            .on('data', function (csvrow) {
                arr.push(csvrow);
            })
            .on('end', function () {
                arrs.push(arr);
                if (arrs.length == csvs.length)
                    runComparison();
            });
    });

});

function runComparison() {
    let xor = _.xorWith(arrs[0], arrs[1], compare);

    let csvStream = csv.format({ headers: true });

    csvStream.pipe(fs.createWriteStream('out/xor.csv')).on('end', () => process.exit());
    xor.forEach(row=>{
        csvStream.write(row);
    });
    csvStream.end();

    csvStream = csv.format({ headers: true });
    csvStream.pipe(fs.createWriteStream('out/diff.csv')).on('end', () => process.exit());
    differences.forEach(row=>{
        csvStream.write(row);
    });
    csvStream.end();
}

function compare(a, b) {
    // console.log("Comparing", {a: a, b:b});
    let result = _.isEqual(a, b);
    if(!result) differences.push(b);
    // console.log("Result: "+result);
    return result;
}