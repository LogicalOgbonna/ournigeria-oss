# Auto-captured from the real INEC BORNO.xlsx 'SC' sheet (openpyxl read_only, data_only).
# Trimmed to header + first 6 constituencies.
# BORNO layout differs from ABIA: it has a SEPARATE 'CODE' column, so RA
# COMPOSITION / count columns shift right by one. Header row is index 2.
# Columns: [S/N, NAME, CODE, RA COMPOSITION, NO.OF RAs, NO. OF PUs, COLLATION].
# Note leading spaces in ' RA COMPOSITION' header and some composition cells.
# Do NOT hand-edit; regenerate from the cached workbook if the parser contract changes.

BORNO_SC_ROWS = [
    ['BORNO  STATE', None, None, None, None, None, None],
    ['STATE CONSTITUENCIES', None, None, None, None, None, None],
    ['S/N',
     'NAME OF STATE CONSTITUENCY & CODE',
     'CODE',
     ' RA COMPOSITION',
     'NO.OF RAs',
     'NO. OF PUs',
     'NAME OF COLLATION CENTRE'],
    [1,
     'Abadam',
     'SC/190/BO',
     'Arege, Banowa, Fuguwa, Jabullam. Kudokurgu, Malam kaunari, '
     'Mallamfatori Kessa, Yau, Yawa Kura, Yituwa',
     10,
     93,
     'Inec L.G.A, Office, Abadam'],
    [None, None, None, None, None, None, None],
    [2,
     'Askira/Uba',
     'SC/191/BO',
     ' Askira East, Chul/Rumirgo, Dille/ Huyum, Husara/Tampul, Kopa/ Multhafu, '
     'Lassa, Mussa, Ngohi, Ngulde, Uba, Uda/uvu, Wamdeo/ Giwi, Zadawa/Hausari',
     13,
     260,
     'Inec L.G.A, Office, Askira/Uba'],
    [3,
     'Bama I',
     'SC/192/BO',
     'Dipchari/Jere/Dar -Jamal/ Kotembe, Kasugula, Lawanti/ '
     'Malam/Mastari/Abbaram, Mbuliya/Goniri/Siraja, Sabsabwa /Soye/Bulongu, '
     'Shehuri/Hausari /Mairi',
     6,
     152,
     'Inec L.G.A, Office, Bama'],
    [4,
     'Bayo',
     'SC/193/BO',
     'Balbaya, Briyel, Fikayel, Gamadadi, Jara Dali, Jara  Gol, Limanti, Teli, '
     'Wuyo, Zara',
     10,
     95,
     'Inec L.G.A, Office, Bayo'],
    [5,
     'Biu',
     'SC/194/BO',
     'Buratai, Dadin Kowa, Dugia, Garubula, Gur, Kenken, Mandara Girau, Miringa, '
     'Sulumthla, Yawi, Zarawuyaku',
     11,
     270,
     'Inec L.G.A, Office, Biu'],
    [6,
     'Chibok',
     'SC/195/BO',
     'Chibok Garu, Chibok Likama, Chibok Wuntaku, Gatamarwa, Kautikari, '
     'Korongilim, kuburmbula, Mbalala, Mboa Kura, Peni, Shikarkir',
     11,
     118,
     'Inec L.G.A, Office, Chibok'],
]
