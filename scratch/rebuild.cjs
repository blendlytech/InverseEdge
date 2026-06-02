const fs = require('fs');
const path = require('path');

const rawNewData = `
Feb. 28, 2025: Evening
Pick 3 Numbers

215

Feb. 28, 2025: Midday
Pick 3 Numbers

091

Feb. 27, 2025: Evening
Pick 3 Numbers

870

Feb. 27, 2025: Midday
Pick 3 Numbers

462

Feb. 26, 2025: Evening
Pick 3 Numbers

640

Feb. 26, 2025: Midday
Pick 3 Numbers

594

Feb. 25, 2025: Evening
Pick 3 Numbers

797

Feb. 25, 2025: Midday
Pick 3 Numbers

341

Feb. 24, 2025: Evening
Pick 3 Numbers

521

Feb. 24, 2025: Midday
Pick 3 Numbers

171

Feb. 23, 2025: Evening
Pick 3 Numbers

300

Feb. 23, 2025: Midday
Pick 3 Numbers

736

Feb. 22, 2025: Evening
Pick 3 Numbers

834

Feb. 22, 2025: Midday
Pick 3 Numbers

518

Feb. 21, 2025: Evening
Pick 3 Numbers

018

Feb. 21, 2025: Midday
Pick 3 Numbers

072

Feb. 20, 2025: Evening
Pick 3 Numbers

612

Feb. 20, 2025: Midday
Pick 3 Numbers

970

Feb. 19, 2025: Evening
Pick 3 Numbers

579

Feb. 19, 2025: Midday
Pick 3 Numbers

389

Feb. 18, 2025: Evening
Pick 3 Numbers

757

Feb. 18, 2025: Midday
Pick 3 Numbers

196

Feb. 17, 2025: Evening
Pick 3 Numbers

803

Feb. 17, 2025: Midday
Pick 3 Numbers

690

Feb. 16, 2025: Evening
Pick 3 Numbers

681

Feb. 16, 2025: Midday
Pick 3 Numbers

345

Feb. 15, 2025: Evening
Pick 3 Numbers

856

Feb. 15, 2025: Midday
Pick 3 Numbers

236

Feb. 14, 2025: Evening
Pick 3 Numbers

758

Feb. 14, 2025: Midday
Pick 3 Numbers

681

Feb. 13, 2025: Evening
Pick 3 Numbers

745

Feb. 13, 2025: Midday
Pick 3 Numbers

968

Feb. 12, 2025: Evening
Pick 3 Numbers

438

Feb. 12, 2025: Midday
Pick 3 Numbers

832

Feb. 11, 2025: Evening
Pick 3 Numbers

906

Feb. 11, 2025: Midday
Pick 3 Numbers

692

Feb. 10, 2025: Evening
Pick 3 Numbers

445

Feb. 10, 2025: Midday
Pick 3 Numbers

980

Feb. 9, 2025: Evening
Pick 3 Numbers

223

Feb. 9, 2025: Midday
Pick 3 Numbers

415

Feb. 8, 2025: Evening
Pick 3 Numbers

256

Feb. 8, 2025: Midday
Pick 3 Numbers

843

Feb. 7, 2025: Evening
Pick 3 Numbers

160

Feb. 7, 2025: Midday
Pick 3 Numbers

934

Feb. 6, 2025: Evening
Pick 3 Numbers

835

Feb. 6, 2025: Midday
Pick 3 Numbers

920

Feb. 5, 2025: Evening
Pick 3 Numbers

526

Feb. 5, 2025: Midday
Pick 3 Numbers

072

Feb. 4, 2025: Evening
Pick 3 Numbers

523

Feb. 4, 2025: Midday
Pick 3 Numbers

227

Feb. 3, 2025: Evening
Pick 3 Numbers

830

Feb. 3, 2025: Midday
Pick 3 Numbers

509

Feb. 2, 2025: Evening
Pick 3 Numbers

131

Feb. 2, 2025: Midday
Pick 3 Numbers

059

Feb. 1, 2025: Evening
Pick 3 Numbers

337

Feb. 1, 2025: Midday
Pick 3 Numbers

729

Jan. 31, 2025: Evening
Pick 3 Numbers

112

Jan. 31, 2025: Midday
Pick 3 Numbers

914

Jan. 30, 2025: Evening
Pick 3 Numbers

673

Jan. 30, 2025: Midday
Pick 3 Numbers

286

Jan. 29, 2025: Evening
Pick 3 Numbers

323

Jan. 29, 2025: Midday
Pick 3 Numbers

843

Jan. 28, 2025: Evening
Pick 3 Numbers

129

Jan. 28, 2025: Midday
Pick 3 Numbers

954

Jan. 27, 2025: Evening
Pick 3 Numbers

688

Jan. 27, 2025: Midday
Pick 3 Numbers

756

Jan. 26, 2025: Evening
Pick 3 Numbers

247

Jan. 26, 2025: Midday
Pick 3 Numbers

787

Jan. 25, 2025: Evening
Pick 3 Numbers

891

Jan. 25, 2025: Midday
Pick 3 Numbers

374

Jan. 24, 2025: Evening
Pick 3 Numbers

970

Jan. 24, 2025: Midday
Pick 3 Numbers

792

Jan. 23, 2025: Evening
Pick 3 Numbers

796

Jan. 23, 2025: Midday
Pick 3 Numbers

081

Jan. 22, 2025: Evening
Pick 3 Numbers

486

Jan. 22, 2025: Midday
Pick 3 Numbers

631

Jan. 21, 2025: Evening
Pick 3 Numbers

205

Jan. 21, 2025: Midday
Pick 3 Numbers

955

Jan. 20, 2025: Evening
Pick 3 Numbers

295

Jan. 20, 2025: Midday
Pick 3 Numbers

000

Jan. 19, 2025: Evening
Pick 3 Numbers

830

Jan. 19, 2025: Midday
Pick 3 Numbers

683

Jan. 18, 2025: Evening
Pick 3 Numbers

602

Jan. 18, 2025: Midday
Pick 3 Numbers

026

Jan. 17, 2025: Evening
Pick 3 Numbers

744

Jan. 17, 2025: Midday
Pick 3 Numbers

598

Jan. 16, 2025: Evening
Pick 3 Numbers

822

Jan. 16, 2025: Midday
Pick 3 Numbers

518

Jan. 15, 2025: Evening
Pick 3 Numbers

266

Jan. 15, 2025: Midday
Pick 3 Numbers

102

Jan. 14, 2025: Evening
Pick 3 Numbers

286

Jan. 14, 2025: Midday
Pick 3 Numbers

680

Jan. 13, 2025: Evening
Pick 3 Numbers

054

Jan. 13, 2025: Midday
Pick 3 Numbers

750

Jan. 12, 2025: Evening
Pick 3 Numbers

786

Jan. 12, 2025: Midday
Pick 3 Numbers

886

Jan. 11, 2025: Evening
Pick 3 Numbers

410

Jan. 11, 2025: Midday
Pick 3 Numbers

095

Jan. 10, 2025: Evening
Pick 3 Numbers

163

Jan. 10, 2025: Midday
Pick 3 Numbers

532

Jan. 9, 2025: Evening
Pick 3 Numbers

557

Jan. 9, 2025: Midday
Pick 3 Numbers

680

Jan. 8, 2025: Evening
Pick 3 Numbers

622

Jan. 8, 2025: Midday
Pick 3 Numbers

299

Jan. 7, 2025: Evening
Pick 3 Numbers

348

Jan. 7, 2025: Midday
Pick 3 Numbers

973

Jan. 6, 2025: Evening
Pick 3 Numbers

306

Jan. 6, 2025: Midday
Pick 3 Numbers

687

Jan. 5, 2025: Evening
Pick 3 Numbers

874

Jan. 5, 2025: Midday
Pick 3 Numbers

875

Jan. 4, 2025: Evening
Pick 3 Numbers

725

Jan. 4, 2025: Midday
Pick 3 Numbers

394

Jan. 3, 2025: Evening
Pick 3 Numbers

687

Jan. 3, 2025: Midday
Pick 3 Numbers

607

Jan. 2, 2025: Evening
Pick 3 Numbers

193

Jan. 2, 2025: Midday
Pick 3 Numbers

607

Jan. 1, 2025: Evening
Pick 3 Numbers

148

Jan. 1, 2025: Midday
Pick 3 Numbers

207

Dec. 31, 2024: Evening
Pick 3 Numbers

742

Dec. 31, 2024: Midday
Pick 3 Numbers

519

Dec. 30, 2024: Evening
Pick 3 Numbers

672

Dec. 30, 2024: Midday
Pick 3 Numbers

916

Dec. 29, 2024: Evening
Pick 3 Numbers

125

Dec. 29, 2024: Midday
Pick 3 Numbers

404

Dec. 28, 2024: Evening
Pick 3 Numbers

290

Dec. 28, 2024: Midday
Pick 3 Numbers

019

Dec. 27, 2024: Evening
Pick 3 Numbers

166

Dec. 27, 2024: Midday
Pick 3 Numbers

833

Dec. 26, 2024: Evening
Pick 3 Numbers

403

Dec. 26, 2024: Midday
Pick 3 Numbers

819

Dec. 24, 2024: Evening
Pick 3 Numbers

845

Dec. 24, 2024: Midday
Pick 3 Numbers

652

Dec. 23, 2024: Evening
Pick 3 Numbers

313

Dec. 23, 2024: Midday
Pick 3 Numbers

465

Dec. 22, 2024: Evening
Pick 3 Numbers

979

Dec. 22, 2024: Midday
Pick 3 Numbers

781

Dec. 21, 2024: Evening
Pick 3 Numbers

326

Dec. 21, 2024: Midday
Pick 3 Numbers

832

Dec. 20, 2024: Evening
Pick 3 Numbers

256

Dec. 20, 2024: Midday
Pick 3 Numbers

326

Dec. 19, 2024: Evening
Pick 3 Numbers

554

Dec. 19, 2024: Midday
Pick 3 Numbers

482

Dec. 18, 2024: Evening
Pick 3 Numbers

878

Dec. 18, 2024: Midday
Pick 3 Numbers

244

Dec. 17, 2024: Evening
Pick 3 Numbers

578

Dec. 17, 2024: Midday
Pick 3 Numbers

582

Dec. 16, 2024: Evening
Pick 3 Numbers

102

Dec. 16, 2024: Midday
Pick 3 Numbers

645

Dec. 15, 2024: Evening
Pick 3 Numbers

610

Dec. 15, 2024: Midday
Pick 3 Numbers

132

Dec. 14, 2024: Evening
Pick 3 Numbers

616

Dec. 14, 2024: Midday
Pick 3 Numbers

304

Dec. 13, 2024: Evening
Pick 3 Numbers

319

Dec. 13, 2024: Midday
Pick 3 Numbers

780

Dec. 12, 2024: Evening
Pick 3 Numbers

403

Dec. 12, 2024: Midday
Pick 3 Numbers

758

Dec. 11, 2024: Evening
Pick 3 Numbers

625

Dec. 11, 2024: Midday
Pick 3 Numbers

801

Dec. 10, 2024: Evening
Pick 3 Numbers

953

Dec. 10, 2024: Midday
Pick 3 Numbers

985

Dec. 9, 2024: Evening
Pick 3 Numbers

001

Dec. 9, 2024: Midday
Pick 3 Numbers

783

Dec. 8, 2024: Evening
Pick 3 Numbers

335

Dec. 8, 2024: Midday
Pick 3 Numbers

089

Dec. 7, 2024: Evening
Pick 3 Numbers

410

Dec. 7, 2024: Midday
Pick 3 Numbers

307

Dec. 6, 2024: Evening
Pick 3 Numbers

515

Dec. 6, 2024: Midday
Pick 3 Numbers

567

Dec. 5, 2024: Evening
Pick 3 Numbers

739

Dec. 5, 2024: Midday
Pick 3 Numbers

455

Dec. 4, 2024: Evening
Pick 3 Numbers

448

Dec. 4, 2024: Midday
Pick 3 Numbers

140

Dec. 3, 2024: Evening
Pick 3 Numbers

042

Dec. 3, 2024: Midday
Pick 3 Numbers

375

Dec. 2, 2024: Evening
Pick 3 Numbers

181

Dec. 2, 2024: Midday
Pick 3 Numbers

429

Dec. 1, 2024: Evening
Pick 3 Numbers

084

Dec. 1, 2024: Midday
Pick 3 Numbers

659

Nov. 30, 2024: Evening
Pick 3 Numbers

504

Nov. 30, 2024: Midday
Pick 3 Numbers

014

Nov. 29, 2024: Evening
Pick 3 Numbers

074

Nov. 29, 2024: Midday
Pick 3 Numbers

388

Nov. 28, 2024: Evening
Pick 3 Numbers

530

Nov. 28, 2024: Midday
Pick 3 Numbers

275

Nov. 27, 2024: Evening
Pick 3 Numbers

061

Nov. 27, 2024: Midday
Pick 3 Numbers

319

Nov. 26, 2024: Evening
Pick 3 Numbers

489

Nov. 26, 2024: Midday
Pick 3 Numbers

703

Nov. 25, 2024: Evening
Pick 3 Numbers

537

Nov. 25, 2024: Midday
Pick 3 Numbers

205

Nov. 24, 2024: Evening
Pick 3 Numbers

630

Nov. 24, 2024: Midday
Pick 3 Numbers

042

Nov. 23, 2024: Evening
Pick 3 Numbers

553

Nov. 23, 2024: Midday
Pick 3 Numbers

294

Nov. 22, 2024: Evening
Pick 3 Numbers

625

Nov. 22, 2024: Midday
Pick 3 Numbers

621

Nov. 21, 2024: Evening
Pick 3 Numbers

925

Nov. 21, 2024: Midday
Pick 3 Numbers

229

Nov. 20, 2024: Evening
Pick 3 Numbers

720

Nov. 20, 2024: Midday
Pick 3 Numbers

589

Nov. 19, 2024: Evening
Pick 3 Numbers

440

Nov. 19, 2024: Midday
Pick 3 Numbers

480

Nov. 18, 2024: Evening
Pick 3 Numbers

608

Nov. 18, 2024: Midday
Pick 3 Numbers

076

Nov. 17, 2024: Evening
Pick 3 Numbers

751

Nov. 17, 2024: Midday
Pick 3 Numbers

312

Nov. 16, 2024: Evening
Pick 3 Numbers

009

Nov. 16, 2024: Midday
Pick 3 Numbers

860

Nov. 15, 2024: Evening
Pick 3 Numbers

969

Nov. 15, 2024: Midday
Pick 3 Numbers

082

Nov. 14, 2024: Evening
Pick 3 Numbers

463

Nov. 14, 2024: Midday
Pick 3 Numbers

937

Nov. 13, 2024: Evening
Pick 3 Numbers

284

Nov. 13, 2024: Midday
Pick 3 Numbers

969

Nov. 12, 2024: Evening
Pick 3 Numbers

690

Nov. 12, 2024: Midday
Pick 3 Numbers

143

Nov. 11, 2024: Evening
Pick 3 Numbers

947

Nov. 11, 2024: Midday
Pick 3 Numbers

070

Nov. 10, 2024: Evening
Pick 3 Numbers

694

Nov. 10, 2024: Midday
Pick 3 Numbers

850

Nov. 9, 2024: Evening
Pick 3 Numbers

711

Nov. 9, 2024: Midday
Pick 3 Numbers

632

Nov. 8, 2024: Evening
Pick 3 Numbers

627

Nov. 8, 2024: Midday
Pick 3 Numbers

761

Nov. 7, 2024: Evening
Pick 3 Numbers

291

Nov. 7, 2024: Midday
Pick 3 Numbers

586

Nov. 6, 2024: Evening
Pick 3 Numbers

884

Nov. 6, 2024: Midday
Pick 3 Numbers

017

Nov. 5, 2024: Evening
Pick 3 Numbers

466

Nov. 5, 2024: Midday
Pick 3 Numbers

449

Nov. 4, 2024: Evening
Pick 3 Numbers

140

Nov. 4, 2024: Midday
Pick 3 Numbers

641

Nov. 3, 2024: Evening
Pick 3 Numbers

400

Nov. 3, 2024: Midday
Pick 3 Numbers

339

Nov. 2, 2024: Evening
Pick 3 Numbers

654

Nov. 2, 2024: Midday
Pick 3 Numbers

692

Nov. 1, 2024: Evening
Pick 3 Numbers

448

Nov. 1, 2024: Midday
Pick 3 Numbers

369
`;

// Also need the data from May that got lost:
const missingMayData = `
  { date: '2025-05-31 Evening', draw: '290' },
  { date: '2025-05-31 Midday', draw: '407' },
  { date: '2025-05-30 Evening', draw: '387' },
  { date: '2025-05-30 Midday', draw: '523' },
  { date: '2025-05-29 Evening', draw: '614' },
  { date: '2025-05-29 Midday', draw: '691' },
  { date: '2025-05-28 Evening', draw: '068' },
  { date: '2025-05-28 Midday', draw: '565' },
  { date: '2025-05-27 Evening', draw: '355' },
  { date: '2025-05-27 Midday', draw: '955' },
  { date: '2025-05-26 Evening', draw: '568' },
  { date: '2025-05-26 Midday', draw: '649' },
  { date: '2025-05-25 Evening', draw: '984' },
  { date: '2025-05-25 Midday', draw: '511' },
  { date: '2025-05-24 Evening', draw: '084' },
  { date: '2025-05-24 Midday', draw: '758' },
  { date: '2025-05-23 Evening', draw: '107' },
  { date: '2025-05-23 Midday', draw: '941' },
  { date: '2025-05-22 Evening', draw: '081' },
  { date: '2025-05-22 Midday', draw: '101' },
  { date: '2025-05-21 Evening', draw: '299' },
  { date: '2025-05-21 Midday', draw: '141' },
  { date: '2025-05-20 Evening', draw: '663' },
  { date: '2025-05-20 Midday', draw: '757' },
  { date: '2025-05-19 Evening', draw: '881' },
  { date: '2025-05-19 Midday', draw: '867' },
  { date: '2025-05-18 Evening', draw: '381' },
  { date: '2025-05-18 Midday', draw: '573' },
  { date: '2025-05-17 Evening', draw: '856' },
  { date: '2025-05-17 Midday', draw: '104' },
  { date: '2025-05-16 Evening', draw: '610' },
  { date: '2025-05-16 Midday', draw: '658' },
  { date: '2025-05-15 Evening', draw: '065' },
  { date: '2025-05-15 Midday', draw: '588' },
  { date: '2025-05-14 Evening', draw: '357' },
  { date: '2025-05-14 Midday', draw: '752' },
  { date: '2025-05-13 Evening', draw: '616' },
  { date: '2025-05-13 Midday', draw: '401' },
  { date: '2025-05-12 Evening', draw: '864' },
  { date: '2025-05-12 Midday', draw: '298' },
  { date: '2025-05-11 Evening', draw: '851' },
  { date: '2025-05-11 Midday', draw: '872' },
  { date: '2025-05-10 Evening', draw: '913' },
  { date: '2025-05-10 Midday', draw: '967' },
  { date: '2025-05-09 Evening', draw: '669' },
  { date: '2025-05-09 Midday', draw: '274' },
  { date: '2025-05-08 Evening', draw: '549' },
  { date: '2025-05-08 Midday', draw: '844' },
  { date: '2025-05-07 Evening', draw: '690' },
  { date: '2025-05-07 Midday', draw: '154' },
  { date: '2025-05-06 Evening', draw: '782' },
  { date: '2025-05-06 Midday', draw: '089' },
  { date: '2025-05-05 Evening', draw: '354' },
  { date: '2025-05-05 Midday', draw: '001' },
  { date: '2025-05-04 Evening', draw: '670' },
  { date: '2025-05-04 Midday', draw: '335' },
  { date: '2025-05-03 Evening', draw: '877' },
  { date: '2025-05-03 Midday', draw: '952' },
  { date: '2025-05-02 Evening', draw: '134' },
  { date: '2025-05-02 Midday', draw: '692' },
`;

const file = fs.readFileSync('src/App.jsx', 'utf8');

// Match all { date: '...', draw: '...' }
const regex = /\{\s*date:\s*'([^']+)',\s*draw:\s*'([^']+)'\s*\}/g;
let match;
const drawsMap = new Map();
while ((match = regex.exec(file)) !== null) {
  drawsMap.set(match[1], match[2]);
}

// Add the lost May data
const mayRegex = /\{\s*date:\s*'([^']+)',\s*draw:\s*'([^']+)'\s*\}/g;
while ((match = mayRegex.exec(missingMayData)) !== null) {
  drawsMap.set(match[1], match[2]);
}

// Parse the raw text
const monthMap = {
  'Jan.': '01',
  'Feb.': '02',
  'March': '03',
  'April': '04',
  'May': '05',
  'June': '06',
  'July': '07',
  'Aug.': '08',
  'Sept.': '09',
  'Oct.': '10',
  'Nov.': '11',
  'Dec.': '12'
};

const lines = rawNewData.split('\n');
let currentDate = null;
let currentType = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.match(/^(Jan\.|Feb\.|March|April|May|June|July|Aug\.|Sept\.|Oct\.|Nov\.|Dec\.)/)) {
    const parts = line.split(':');
    const dateStr = parts[0].trim();
    const type = parts[1].trim(); // Evening or Midday
    
    // Parse dateStr e.g. "Feb. 28, 2025"
    const dateParts = dateStr.replace(',', '').split(' ');
    const month = monthMap[dateParts[0]];
    const day = dateParts[1].padStart(2, '0');
    const year = dateParts[2];
    
    currentDate = `${year}-${month}-${day}`;
    currentType = type;
  } else if (line.match(/^\d{3}$/) && currentDate && currentType) {
    const draw = line;
    drawsMap.set(`${currentDate} ${currentType}`, draw);
    currentDate = null;
    currentType = null;
  }
}

// Convert Map back to array and sort descending by date (so 2025-12 comes before 2025-11, etc)
const allDraws = Array.from(drawsMap.entries()).map(([date, draw]) => ({ date, draw }));
allDraws.sort((a, b) => b.date.localeCompare(a.date));

// Build replacement string
const newArrayStr = 'const DEFAULT_MOCK_DRAWS = [\n' + allDraws.map(d => `  { date: '${d.date}', draw: '${d.draw}' }`).join(',\n') + '\n];';

const startIndex = file.indexOf('const DEFAULT_MOCK_DRAWS = [');
const endIndex = file.indexOf('];', startIndex) + 2;

const newFileContent = file.substring(0, startIndex) + newArrayStr + file.substring(endIndex);
fs.writeFileSync('src/App.jsx', newFileContent);
console.log('App.jsx updated. Total draws: ' + allDraws.length);
