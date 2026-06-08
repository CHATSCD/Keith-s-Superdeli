import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side, numbers
from openpyxl.utils import get_column_letter
import re

# ── BEK MASTER LIST ──────────────────────────────────────────────────────────
# (item_num, name, brand, pack_size, case_price)
BEK = [
    ("148512","Dough Scone Toga Blubry Lemon","Aphrodite Divine Confections","54/3 OZ",54.32),
    ("228975","Donut Ring Yeast Homestyle","Rich's","84/2.1 OZ",36.53),
    ("384952","Pizza Puff Ham & Cheese","Iltaco","48/6 OZ",80.63),
    ("384951","Pizza Puff Pepperoni","Iltaco","48/6 OZ",70.91),
    ("160977","Pizza Puff Taco","Iltaco","48/6 OZ",71.82),
    ("301629","Sauce Cocktail Cups Gf","Ken's","100/1.5 OZ",28.94),
    ("412443","Dough Cinnamon Roll Gourmet","Rich's","108/5 OZ",82.74),
    ("018070","Soft Serve Mix Van Non Dairy","Frostline","6/6 LB",78.19),
    ("372064","Casserole Broccoli Rice Cheese","St Clair","4/4.75 LB",50.81),
    ("555958","Keith's Superstore 32 oz Foam","Dart","1/500 ct",83.99),
    ("180359","Bag Sandwich 6.5x7x1.75","Elkay Plastics","1/2000 CT",18.58),
    ("556706","Lid Plas Cont 8 oz Dome","Karat","20/50 ct",67.25),
    ("816010","Cont Paper 8 Oz White","Karat","1/1000 CT",58.53),
    ("302858","Film 18x2000 Pvc Slide Cutter","Western Plastics","1/2000 CT",18.69),
    ("792054","Topping Caramel","Lyons Magnus","6/#5 CAN",72.34),
    ("153064","Sausage Link Pineapple","Country Pleasin","1/10 LB",51.37),
    ("191055","Sausage Smokies 5 In","Country Pleasin","1/10 LB",47.54),
    ("221021","Pie Strawberry Shortcake Mini","Cyrus","8/7 OZ",21.19),
    ("221023","Pie Coconut Cream Mini","Cyrus","8/7 OZ",21.19),
    ("221022","Pie Chocolate Cream Mini","Cyrus","8/7 OZ",21.19),
    ("221024","Pie Banana Cream Mini","Cyrus","8/7 OZ",21.19),
    ("799424","Cereal Grits Quick White","Quaker","8/5 LB",42.88),
    ("197805","Ham Patty 2 Oz 3.5 In","Cloverdale Foods","2/6 LB",52.33),
    ("184380","Sausage Link Smoked Split 2.5 oz","Country Pleasin","1/10 LB",48.52),
    ("159734","Chicken Liver Random Fresh","Marjac Poultry","4/5 LB",14.78),
    ("138142","Chicken Patty Breaded Raw","Tyson Red Label","2/5 LB",24.66),
    ("555957","Keiths Superstore 20 oz Foam","Dart","1/500 ct",50.99),
    ("546495","Bbq Pork Pulled With Sauce","Saucy Blues","2/5 LB",60.55),
    ("168534","Egg Roll Cheesecake Dessert","The Eggroll Factory","100/2.5 OZ",73.74),
    ("361109","Hashbrown Patty","Traditional","6/5 LB",70.06),
    ("840179","Lid Plas 20sl Trans Slotted","Dart","10/100 CT",49.89),
    ("114792","Cup Foam 32 Oz Pedestal","Dart","25/16 CT",64.65),
    ("142728","Cabbage Green Chunk","Taylor Farms","4/5 LB",19.41),
    ("693014","Breading Fish Fry New Orleans","Louisiana Fish Fry Products","1/25 LB",31.66),
    ("419055","Donut Glazed Yeast Raised","Rich's","108/1.2 OZ",56.00),
    ("677082","Jelly Pc Apple","Smucker's","200/0.5 OZ",15.63),
    ("126922","Tater Keg Bacon Cheddar Chive","Tater Kegs","1/10 LB",38.72),
    ("530572","Bacon Layout 18/22","Smithfield","1/15 LB",49.81),
    ("191379","Bag French Fry 4.5 X 4.5","Mcnairn","1/2000 CT",41.39),
    ("114428","Bag Paper Groc Brn 6#","Duro Bag Mfg Co.","1/500 CT",17.20),
    ("114429","Bag Paper Groc Brn 8#","Duro Bag Mfg Co.","1/500 CT",19.99),
    ("129707","Bag Reclosable 1 Gal 10.5x10.5","Essentials","1/250 CT",16.76),
    ("129708","Bag Reclosable 2 Gal 13x15.5","Essentials","1/100 CT",15.26),
    ("875138","Bag Sandwich 6x.75x6.75 1side","Mcnairn","1/2000 CT",44.53),
    ("334153","Bean Baby Lima","Markon First Crop","1/20 LB",35.91),
    ("190557","Bean Baked Original","Bush's Best","6/#10 CAN",51.75),
    ("650058","Bean Black Low Sodium","Bush's Best","6/#10 CAN",38.66),
    ("334302","Bean Green Regular Cut","Markon First Crop","12/2 LB",33.41),
    ("650110","Bean Kidney Dark Red Fancy","Allens","6/#10 CAN",35.53),
    ("024055","Bean Light Red Kidney 20#dry","Packer","1/20 LB",33.23),
    ("650045","Bean Lima Medium","Allens","6/#10 CAN",41.57),
    ("782002","Bean Refried","Allens","6/#10 CAN",51.06),
    ("506121","Beef Patty 3/1 Thick N Tender","Tnt","60/5.33 OZ",88.78),
    ("188915","Beef Sandwich Steak Philly","Philly","40/4 OZ",55.08),
    ("188849","Beef Steak Fritter Raw Breaded","Chefs Exclusive","40/4 OZ",66.23),
    ("144183","Bleach Keith Ultra","Essentials","6/1 GAL",21.45),
    ("228851","Bologna Pork/beef Sl 12 Oz","Kelley Foods Manufacturing","8/12 OZ",28.37),
    ("204979","Bologna Smk Thick Slice 4 Oz","Cades","10/16 OZ",30.93),
    ("019275","Box Carry-out Snack 7x4.5x2.75","Southern Champion Tray","1/500 CT",78.12),
    ("170610","Box Chicken White 9x6x3","Vox Printing","1/400 CT",65.14),
    ("189661","Bread Texas Toast White","Fresh From Keith's","10/24 OZ",26.36),
    ("021175","Bread White Pullman 28 Sl 24oz","Flowers Food Specialty Group","10/24 OZ",35.53),
    ("693334","Breading Shrimp Fry","Louisiana Fish Fry Products","1/50 LB",56.64),
    ("414312","Brownie Chocolate Chip","David's Cookies","48/4 OZ",47.36),
    ("333105","Brussels Sprouts Medium","Markon First Crop","12/2 LB",55.91),
    ("394690","Bun Hamburger 5 In Sliced","European Bakers","64/3.5 OZ",32.28),
    ("189663","Bun Hamburger White 4 In","Fresh From Keith's","8/12 CT",25.45),
    ("189664","Bun Hot Dog 6 In Frozen","Fresh From Keith's","8/12 CT",25.45),
    ("385084","Burrito Beef & Bean","Fernando's","72/4 OZ",61.25),
    ("389120","Butter Unsalted European Style","Plugra","36/1 LB",107.65),
    ("300009","Cabbage Fine Diced W/sep Colo","Packer","4/5 LB",19.39),
    ("018044","Cake Carrot 2 Layer","Dean's Cake House, Inc","4/46 OZ",76.99),
    ("116574","Cake Italian Lemon Creme","Diannes","2/66 OZ",75.78),
    ("173490","Candy Gummy Worm Mini","Albanese","4/5 LB",54.57),
    ("012324","Carrots Sliced Smooth Bulk Iqf","Frost Sweet","1/20 LB",24.55),
    ("143885","Casserole Hashbrown","Savannah Foods","4/4.5 LB",61.43),
    ("372098","Casserole Potato Baked","St Clair","4/4.75 LB",49.78),
    ("372131","Casserole Sweet Potato","St Clair","4/4.75 LB",54.86),
    ("121802","Cheese American Yellow 184 Sl","Schreiber","4/5 LB",56.23),
    ("016063","Cheese Cheddar Mild Shrd","Schreiber","4/5 LB",61.21),
    ("742002","Cheese Cream Loaf Grade A","Golden Harvest","10/3 LB",72.33),
    ("168749","Cheese Mozz Feather Shred Lmwm","Bellacibo","4/5 LB",51.77),
    ("151722","Cheese Pepper Jack Slice .73oz","Golden Harvest","12/1 LB",48.14),
    ("184643","Cheese Sauce Cheddar","Keith Valley","6/#10 CAN",64.78),
    ("184873","Cheese Sauce Monterey Jack","Gran Sabor","6/#10 CAN",76.02),
    ("139372","Cheese Swiss American 160 Sl","Golden Harvest","4/5 LB",55.72),
    ("186414","Chicken Breast Breaded 5.2 Oz","Tyson Red Label","1/10 LB",41.60),
    ("151017","Chicken Breast Flame Grilled","Brakebush","40/4 OZ",64.81),
    ("550108","Chicken Breast Random Blsl","Koch Foods","4/10 LB",71.21),
    ("165580","Chicken Cut 8pc Mar 3-3.50lb","Marjac Poultry","16/3-3.5 LB",None),  # per lb price
    ("106944","Chicken Fajita Strip Cooked","Gran Sabor","2/5 LB",46.20),
    ("159735","Chicken Gizzard Random Fresh","Marjac Poultry","4/5 LB",19.80),
    ("159740","Chicken Leg Quarter Cvp","Marjac Poultry","4/10 LB",33.39),
    ("550400","Chicken Tenderloin Jumbo","Wayne Farms","4/10 LB",89.22),
    ("025513","Chicken With Dumplings","St Clair","4/5 LB",56.70),
    ("774034","Chili Powder Ground Light","Mccormick","1/18 OZ",11.56),
    ("774060","Cinnamon Ground","Spice Classics","1/18 OZ",7.61),
    ("020175","Cleaner All Prpse W/blch Spray","Quickline","6/32 OZ",36.60),
    ("133312","Cleaner Degree Grill Packet","Ssdc","128/2 OZ",124.25),
    ("108509","Cleaner Floor & All Purpose","Mr Clean","3/1 GAL",52.41),
    ("885134","Cleaner Multisheen Glass Rtu","Ssdc","1/12 LTR",44.93),
    ("885090","Cleaner Multisheen Moprite","Ssdc","2/1 GAL",66.66),
    ("416047","Cobbler Apple","Good Old Days","4/6 LB",40.91),
    ("416072","Cobbler Cherry","Good Old Days","4/5 LB",46.59),
    ("416094","Cobbler Peach","Good Old Days","4/5 LB",44.60),
    ("416043","Cobbler Pecan","Good Old Days","4/5 LB",69.06),
    ("100007","Cone Cake Cup No Jacket","Joy Cone","6/100 CT",70.73),
    ("553241","Cone Waffe Large Classic","Joy Cone","14/16 ct",73.59),
    ("870030","Cont Foam 12 Oz Squat","Dart","20/25 CT",37.71),
    ("870020","Cont Foam 8 Oz Extra Squat","Dart","20/50 CT",62.38),
    ("158734","Cont Foam Hngd 1-c Sand White","Gen Pak","4/125 CT",26.95),
    ("218097","Cont Plas Hngd 1-c Clear 9 In","Dart","1/150 CT",56.19),
    ("872385","Cont Plas Hngd 1-c Pie Wedge","Dart","2/125 CT",58.28),
    ("128656","Cont Plas Hngd 3-c Black Clear","Sabert","2/56 CT",61.62),
    ("338480","Corn Cut Fire Roasted","Roastworks","1/20 LB",42.24),
    ("370154","Corn Dog All Meat w/Bags","State Fair","36/2.67 OZ",28.60),
    ("370008","Corn Dog Chicken","Foster Farms","72/4 OZ",43.77),
    ("370013","Corn Dog Chicken Jalapeno","Foster Farms","36/4 OZ",27.31),
    ("370049","Corn Dog Chili Cheese","Foster Farms","36/4 OZ",28.13),
    ("338836","Corn Nugget Sweet Battered","Golden Crisp","6/2 LB",38.35),
    ("110120","Cornbread Mix Deluxe Complete","Pioneer","6/5 LB",43.97),
    ("301270","Cornmeal Yellow Self Rising","Packer","1/25 LB",25.69),
    ("178740","Crab Claw Fingers Blue","Packer","1/1 LB",21.86),
    ("771510","Cracker Captain Wafer","Lance","500/2 CT",24.53),
    ("800070","Craisin Cranberry Dried","Ocean Spray","1/10 LB",31.69),
    ("127990","Crispito Buffalo Chkn & Chs","State Fair","72/2.75 OZ",57.39),
    ("385211","Crispito Chicken & Cheese","State Fair","72/2.75 OZ",57.39),
    ("815813","Cup Plas Souffe 1 Oz Trans","Essentials","10/250 CT",29.39),
    ("136286","Cutlery Kit K F S Napkin S&p","Amercare","1/250 CT",28.69),
    ("160634","Cutlery Knife Blk Mw Refll","Smartstock","24/40 CT",52.75),
    ("160632","Cutlery Teaspoon Blk Mw Refll","Smartstock","20/40 CT",52.86),
    ("885818","Degreaser Inside Out Moprite","Ssdc","2/1 GAL",69.22),
    ("167379","Degreaser Multi Surface","Dawn Professional","4/1 GAL",64.14),
    ("190390","Dip Street Corn Mexican Style","Jtm Food Group","4/5 LB",67.24),
    ("225292","Dough Apple Turnover","Pillsbury(r)","60/3.7 OZ",60.65),
    ("412862","Dough Biscuit 3 In Sliced","Pillsbury(r)","168/3.17 OZ",53.87),
    ("155249","Dough Cookie Chaos Decadent","David's Cookies","80/4.5 OZ",83.90),
    ("167145","Dough Cookie Lemon Blubry","David's Cookies","80/4.5 OZ",88.42),
    ("106993","Dough Cookie Red Velvet","David's Cookies","80/4.5 OZ",82.30),
    ("417099","Dough Cookie Reeses Pntbtr Cup","David's Cookies","45/4.5 OZ",46.55),
    ("412997","Dough Cookie Smores","David's Cookies","80/4.5 OZ",90.90),
    ("417098","Dough Cookie Triple Chocolate","David's Cookies","45/4.5 OZ",46.22),
    ("412499","Dough Roll Dinner White","Pennant Foods","240/1 OZ",37.56),
    ("885147","Drain Maintainer Enzyme","Essentials","12/32 OZ",91.18),
    ("674189","Dressing Pc Honey Mustard Cup","Ken's","100/1.5 OZ",28.88),
    ("674216","Dressing Pc Ranch Cup","Ken's","100/1.5 OZ",27.20),
    ("164879","Dressing Pc Thousand Island","Ellington Farms","60/1.5 OZ",19.27),
    ("142365","Egg Fresh Shell Med Usda Aa","Ellington Farms","1/30 DZN",26.16),
    ("106188","Egg Patty Homestyle Fried","Papettis","168/1.5 OZ",51.31),
    ("155453","Egg Roll Boudin W/ppr Jack Chs","Frenchys Sausage Company Inc","100/2.8 OZ",69.55),
    ("171854","Egg Roll Chicken Sw Style","Vip","100/3 OZ",79.34),
    ("380237","Egg Roll Pork & Vegetable","Minh","72/3 OZ",56.23),
    ("393106","Egg Scrambled Cooked W/butter","Papettis","12/1.85 LB",63.57),
    ("190102","Egg Whole Easy Eggs w/Citric","Ellington Farms","15/2 LB",58.38),
    ("370434","Empanada Chorizo Egg Jalapeno","Natchitoches Meat Pie Co","48/3.75 OZ",59.72),
    ("777028","Extract Vanilla Imitation","Mccormick","1/32 OZ",7.72),
    ("888042","Filter Powder Magnesol","Magnesol","1/40 LB",110.64),
    ("119164","Flour Hotel & Restaurant","Ellington Farms","1/25 LB",8.82),
    ("119166","Flour Self Rising","Ellington Farms","1/25 LB",11.72),
    ("191857","Foil 18 X 1000 Standard","Atx Packaging","1/1 ROLL",67.08),
    ("194431","Foil Sand Wrap 10.5x14 Cushion","Western Plastics","4/500 CT",82.06),
    ("876013","Foil Sheet 12x10.75 In","Durable Packaging","12/200 CT",175.06),
    ("208075","French Fries Cc 3/8 In Seas","Lambs Seasoned","6/5 LB",68.22),
    ("193524","French Fries SC 5/16 in Thin","Crispy Coat","6/5 LB",62.42),
    ("401194","French Toast Stick Wg 1.1 Oz","Bake Crafters","2/5 LB",25.15),
    ("774374","Garlic Chopped In Water","Italian Rose","6/32 OZ",40.64),
    ("774024","Garlic Powder","Spice Classics","1/16 OZ",7.70),
    ("774229","Garlic Salt No Msg","Spice Classics","1/38 OZ",7.31),
    ("766106","Glaze Honey Dip Heat & Ice","Rich's","1/24 LB",60.18),
    ("147158","Glove Nitrile Xxl Pf Black","Handgards","10/100 CT",52.28),
    ("166859","Glove Vinyl Large Pf","Foodhandler","10/100 CT",34.16),
    ("167562","Glove Vinyl Medium Pf","Job Select","10/100 CT",34.16),
    ("166860","Glove Vinyl Xl Pf","Job Select","10/100 CT",34.16),
    ("157477","Gravy Mix Au Jus","Knorr","12/3.7 OZ",43.67),
    ("797032","Gravy Mix Brown","Shawnee Milling Co","6/14 OZ",16.69),
    ("797060","Gravy Mix Chicken","Pioneer","6/14 OZ",28.95),
    ("797230","Gravy Mix Pepper Biscuit","Pioneer","6/24 OZ",27.40),
    ("113975","Greens Turnip Chopped Seasoned","Margaret Holmes","6/#10 CAN",39.11),
    ("888071","Grill Pad Heavy Duty Orange","Scotch-brite","1/15 CT",18.86),
    ("105991","Guacamole Western Style Frozen","Harvest Fresh","6/3 LB",63.70),
    ("020766","Hair Net Brown 144 Ct","Cellucap","1/144 CT",17.94),
    ("002046","Ham Country Cured Boneless","Clifty Farm Country Meats","128/1.25 OZ",73.77),
    ("206112","Ham Sliced Smoked .67 Oz","Ellington Farms","4/2.5 LB",53.37),
    ("002117","Ham Slices Smoked Center Cut","D. L. Lee & Sons, Llc","12/1 LB",None),  # per lb
    ("677217","Honey Pc Pure Cup","Smucker's","200/0.5 OZ",41.75),
    ("109014","Hushpuppy Corn Sweet","Savannah Foods","2/5 LB",27.35),
    ("152353","Hushpuppy Corn Sweet Jalapeno","Savannah Foods","2/5 LB",27.85),
    ("691585","Icing Chocolate Fudge Rtu","Gold Medal","2/11 LB",84.41),
    ("677079","Jelly Pc Assorted Plastic Cup","Smucker's","200/0.5 OZ",17.61),
    ("190754","Jelly Pc Grape Pouch","Welchs","200/0.5 OZ",21.11),
    ("190753","Jelly Pc Strawberry Pouch","Welchs","200/0.5 OZ",27.41),
    ("185927","Jug Plas 1 Gallon W/lid","Buccaneer","1/48 CT",40.94),
    ("146968","Ketchup Individual 9 Gram Pc","1906","1000/9 GRM",23.32),
    ("878182","Label 2x3 Dissolvable","National Checking","1/250 CT",27.24),
    ("383460","Lasagna Meat","Stouffer's","4/96 OZ",101.23),
    ("123145","Lettuce Iceberg Trimmed Only","Markon First Crop","4/6 CT",69.48),
    ("123073","Lettuce Shred 1/8 In K","Markon Ready Set Serve","4/5 LB",26.36),
    ("123076","Lettuce Shred 1/8 Inch","Markon Ready Set Serve","2/5 LB",20.14),
    ("815814","Lid Plas 1 Oz Clear","Essentials","25/100 CT",19.61),
    ("860055","Lid Plas 16sl Trans Slotted","Dart","10/100 CT",31.13),
    ("870025","Lid Plas 20jl Trans Vented","Dart","10/100 CT",39.00),
    ("188154","Lid Plas 32sl Trans Straw Slot","Dart","10/100 CT",77.46),
    ("143591","Liner Pan 16x24 Quilon","Handy Wacks","1/1000 CT",64.64),
    ("197218","Liner Trash 12-16 Gal Black","Inteplast","1/500 CT",48.09),
    ("197269","Liner Trash 33 Gal Black","Essentials","1/250 CT",24.89),
    ("136135","Liner Trash 60 Gal Black","Berry Plastics","10/10 CT",89.28),
    ("197256","Liner Trash 60 Gal Clear","Essentials","1/100 CT",44.48),
    ("131091","Macaroni & Cheese Homestyle","Rons Home Style Foods","4/5 LB",52.75),
    ("119451","Mayonnaise Extra Heavy Duty","Ellington Farms","4/1 GAL",57.18),
    ("182377","Mayonnaise Pc Poly Pouch","Ellington Farms","200/9 GRM",17.09),
    ("374344","Meat Pie Original Beef & Pork","Natchitoches Meat Pie Co","48/3.75 OZ",55.27),
    ("010008","Meatloaf F/c Pull Apart 12ct","King's Command Foods","12/21 OZ",93.80),
    ("184833","Milk Chocolate 1/2 Pint","Sealtest","24/0.5 PNT",15.63),
    ("184724","Milk Whole Vitamin D","Sealtest","4/1 GAL",27.56),
    ("121396","Mix Creole Jambalaya","Tony Chacheres","8/40 OZ",59.18),
    ("173619","Muffin Cornbread Regular","Muffin Town","96/2 OZ",32.61),
    ("170887","Mustard Pc Pouch 200 Ct","Ellington Farms","200/5.5 GRM",7.85),
    ("880037","Napkin Dinner 17x17 1 Ply","Tork","12/250 CT",70.04),
    ("779116","Oil Whirl","Whirl","3/1 GAL",41.42),
    ("226619","Okra Cut Lightly Breaded","Stilwell","4/5 LB",37.30),
    ("326604","Onion Ring Beer Battered 5/8 in","Tavern Traditions","4/2.5 LB",38.01),
    ("152027","Onion White Jumbo","Packer","1/25 LB",16.66),
    ("026761","Onion Yellow Jumbo Fresh 5lb","Packer","1/5 LB",9.82),
    ("698007","Pan Spray Pam Saute & Grill","Pam","6/17 OZ",28.92),
    ("691188","Pancake Mix Sweet Cream","Krusteaz","6/5 LB",49.17),
    ("214370","Paper Copy 8.5x11 Bright White","Us Business Products Inc","10/500 CT",51.76),
    ("875102","Paper Waxed Deli 12x10.75","Dixie","12/500 CT",100.24),
    ("774726","Parsley Flakes","Mccormick","1/2 OZ",5.80),
    ("205593","Pasta Fettuccini 10 In","Bellacibo Primo","2/10 LB",27.19),
    ("700150","Pasta Penne Rigate Regular","Barilla","2/10 LB",29.09),
    ("205590","Pasta Spaghetti 10 In","Bellacibo Primo","2/10 LB",27.19),
    ("012376","Pea Field W/snaps Bags Iqf","Packer","12/3 LB",57.03),
    ("552603","Peanut Dry Roasted","Planters","6/34.5 OZ",42.72),
    ("165041","Pepper Bell Green","Markon","1/5 LB",14.65),
    ("180821","Pepper Jalapeno 1 1/9 Bsh","Markon First Crop","1/1 CS",35.30),
    ("685040","Pepper Jalapeno Sliced","Cajun Chef","4/1 GAL",43.53),
    ("685002","Pepper Jalapeno Whole","Cajun Chef","4/1 GAL",45.78),
    ("774080","Pepper Lemon Seasoning","Mccormick","1/28 OZ",16.68),
    ("555631","Pickle Chip Dill Thin 1/8\"","Mount Olive","4/1 gal",97.24),
    ("015053","Pickle Dill Relish","Kaiser Pickles Llc","4/1 GAL",35.91),
    ("187397","Pico De Gallo 5 Lb","Markon Ready Set Serve","1/5 LB",13.57),
    ("430121","Pie Pecan Sliced 10 In","Chef Pierre","6/36 OZ",77.95),
    ("010233","Pizza Cheese 12 6/27oz.","Day Night","6/27 OZ",36.51),
    ("370955","Pizza Stick Pepperoni","Hot Pockets","48/3 OZ",32.73),
    ("534047","Pork Chop Boneless Breaded","Pierre Zartic","40/4 OZ",56.31),
    ("145464","Pork Chop Cc Bnls 4oz","Kelley Foods Manufacturing","1/10 LB",54.70),
    ("001011","Pork Loin Bone In Light Frzn","Swift","4/21 LB",None),  # per lb
    ("001238","Pork Spareribs Light Frozen","Swift","9/5.3 LB",None),  # per lb
    ("363433","Potato Mashed Deluxe","Simply Potatoes","4/6 LB",42.97),
    ("142203","Potato Sliced White","Libby","6/#10 CAN",39.18),
    ("194943","Potato Tater Tots Grade A","Ellington Farms","6/5 LB",52.06),
    ("216830","Potato Wedge 8 Cut Seasoned","Golden Phoenix","6/5 LB",51.08),
    ("650314","Potato White Diced","Allens","6/#10 CAN",44.59),
    ("402210","Pretzel King Size 5 Oz","Super Pretzel","50/5.5 OZ",49.82),
    ("182376","Relish Sweet Pc Poly","Ellington Farms","200/9 GRM",16.00),
    ("301052","Rice Parboiled","Producers Rice Mill, Inc","1/25 LB",13.61),
    ("398411","Roll Dinner Hawaiian","Kings Hawaiian Bakery","10/24 CT",59.20),
    ("301979","Salad Dixie Slaw","Resers Fine Foods","2/7 LB",31.05),
    ("768640","Salad Pasta Macaroni","Golden Harvest","2/12 LB",61.23),
    ("150312","Salad Potato Baked","St Clair","2/12 LB",59.80),
    ("768056","Salad Potato Deviled Egg","St Clair","1/12 LB",34.01),
    ("157575","Salad Potato Mustard","St Clair","2/12 LB",52.30),
    ("148002","Salsa Fire Roasted Rtu","Gran Sabor","6/#10 CAN",52.19),
    ("162165","Salt Pc Packs","N'joy","3/1000 CT",9.65),
    ("148661","Sanitizer Hand Mystic Nexa","Ssdc","4/1250 ML",82.19),
    ("885911","Sanitizer Sani-quad Sinkrite","Ssdc","2/1 GAL",87.26),
    ("122730","Sauce Alfredo Pouch","Nestle","4/80 OZ",47.73),
    ("111922","Sauce Bbq Sweet Baby Rays","Sweet Baby Ray's","4/1 GAL",55.18),
    ("107049","Sauce Cheese Queso Blanco","Jtm Food Group","4/5 LB",57.09),
    ("107535","Sauce Pc Bbq Original Cups","Sweet Baby Ray's","100/1.5 OZ",26.63),
    ("674170","Sauce Pc Hot Texas Pete","Texas Pete","200/7 GRM",15.68),
    ("674816","Sauce Pc Marinara Cup","Heinz","60/2 OZ",37.92),
    ("674147","Sauce Pc Picante Salsa Del Sol","Del Sol","200/0.5 OZ",27.69),
    ("115983","Sauce Pc Sweet N Sour Cup","Ken's","100/1 OZ",20.31),
    ("674626","Sauce Pc Tartar Cup","Ken's","100/1.5 OZ",32.02),
    ("124163","Sauce Soy","Ellington Farms","4/1 GAL",25.73),
    ("007252","Sauce Spaghetti #10","Red Gold","6/#10 CAN",42.10),
    ("015187","Sauce Tomato Fancy","Red Gold","6/#10 CAN",35.66),
    ("112784","Sauce Wing Buffalo","Sweet Baby Ray's","4/1 GAL",62.10),
    ("112786","Sauce Wing Kickin Bourbon","Sweet Baby Ray's","4/64 OZ",48.41),
    ("162490","Sausage Link 4 Oz","Country Pleasin","1/10 LB",45.53),
    ("111468","Sausage Patty 2 Oz Cooked","Special Recipe","80/2 OZ",48.46),
    ("300712","Scrubber Stainless Steel","3m Corporation","6/12 CT",87.25),
    ("115570","Seasoning Creole Original","Tony Chacheres","4/8 LB",80.45),
    ("774492","Seasoning Montreal Steak","Mccormick","1/29 OZ",14.01),
    ("779123","Shortening Clear Fry Liquid","Keith's Homestyle","1/35 LB",35.62),
    ("470543","Shrimp Brd 31-40 Ct Butterfly","Mrs Fridays","12/6 OZ",29.69),
    ("158888","Shrimp Raw P&d White 31-40 Ct","Pacific Treasure","5/2 LB",63.17),
    ("118170","Skewer Wooden 10 In","Handgards","10/100 CT",21.78),
    ("885582","Soap Super Rave Sinkrite","Ssdc","2/1 GAL",107.04),
    ("773505","Soft Serve Chocolate","Frostline","6/6 LB",80.60),
    ("773504","Soft Serve Pineapple Mix","Dole","4/4.4 LB",84.49),
    ("123623","Soft Serve Strawberry Mix","Dole","4/4.5 LB",84.49),
    ("123886","Soup Cream Of Chicken","Ellington Farms","12/50 OZ",69.27),
    ("669005","Sour Cream Pc","Daisy Brands","100/1 OZ",13.98),
    ("170174","Squash Yellow Sliced","Fineline","12/3 LB",50.50),
    ("205883","Straw 10.25 In Giant Red","Karat","4/300 CT",16.18),
    ("229075","Sugar Brown Light","Domino Foodservice","12/2 LB",34.60),
    ("780007","Sugar Granulated Fine 50 Lb","Imperial Sugar","1/50 LB",37.86),
    ("008128","Syrup Pc Pancake Maple Premium","Hartleys","100/1.5 OZ",18.85),
    ("176026","Tamale Beef Delta Style","Hot Tamale Heaven","60/6 CT",277.56),
    ("182900","Tape Register Roll Thermal","Amercare","1/50 CT",78.24),
    ("882002","Toilet Tissue 2 Ply Jumbo Jr","Acclaim","8/1000 FT",44.12),
    ("210025","Tomato 5x6 1 Layer","Markon First Crop","1/10 LB",19.49),
    ("125654","Tomato Diced In Juice","Ellington Farms","6/#10 CAN",30.42),
    ("650547","Tomato Diced W/green Chilies","Red Gold","12/28 OZ",26.76),
    ("385964","Tornado Beef Steak Ranchero","Tornados","24/3 OZ",21.38),
    ("385970","Tornado Saus Egg & Cheese","Tornados","24/3 OZ",21.38),
    ("385967","Tornado Southwest Chicken","Tornados","24/3 OZ",21.38),
    ("130838","Tortilla Chip Corn Yel 4 Cut","La Banderita","1/30 LB",28.27),
    ("106051","Tortilla Flour Pressed 12 In","Gran Sabor","12/12 CT",43.93),
    ("408603","Tortilla Flour Pressed 6 Inch","La Banderita","12/24 CT",27.68),
    ("152643","Towel Hand White","Tork","12/410 CT",71.14),
    ("881054","Towel Roll White Center Pull","Sofpull","1/6 CT",62.41),
    ("198212","Tray Food 5 Lb 500 Red Plaid","Essentials","2/250 CT",35.84),
    ("872938","Tray Paper Footlong Hotdog Wht","Southern Champion Tray","1/500 CT",74.58),
    ("349504","Vegetable Blend Corn BLK Bean","Roastworks","6/2.5 LB",35.81),
    ("349493","Vegetable Blend Fajita","Markon First Crop","6/2 LB",27.93),
    ("349916","Vegetable Blend Fried Rice","Minh","4/3 LB",45.89),
    ("125736","Vegetable Mixed Fancy","Ellington Farms","6/#10 CAN",45.14),
    ("175031","Waffe Belgian Maple Flavored","Pillsbury(r)","72/1.4 OZ",30.39),
    ("453005","Catfish Fillet Split 3-5 Oz","Heartland Catfish","1/15 LB",98.03),
    ("109198","Chicken Breast Hot N Spicy Ckd","Tyson Red Label","40/4 OZ",41.06),
]

# Build lookup dicts
bek_by_num = {b[0]: b for b in BEK}
bek_by_name = {}
for b in BEK:
    key = b[1].lower().replace("&","and").replace("'","").replace("-"," ")
    bek_by_name[key] = b

def parse_per_unit(pack_size, case_price):
    """Return (per_unit_price, unit_label) for the smallest portion."""
    if case_price is None:
        return None, "see label"
    ps = pack_size.strip().upper()

    # pattern: QTY/SIZE UNIT  e.g. "60/5.33 OZ", "6/#10 CAN", "1/25 LB"
    m = re.match(r'^(\d+(?:\.\d+)?)\s*/\s*(.+)$', ps)
    if not m:
        return case_price, "per case"
    qty_str, size_part = m.group(1), m.group(2).strip()
    qty = float(qty_str)

    # Special: LB-based → per lb
    if size_part.endswith(' LB') or size_part == 'LB':
        lbs_str = size_part.replace('LB','').strip()
        try:
            lbs_each = float(lbs_str) if lbs_str else 1.0
        except:
            lbs_each = 1.0
        total_lbs = qty * lbs_each
        per_lb = case_price / total_lbs
        return per_lb, f"per lb ({pack_size})"

    # Special: DZN → per dozen and per egg
    if 'DZN' in size_part:
        per_doz = case_price / qty
        per_egg = per_doz / 12
        return per_egg, f"per egg (30 dz case)"

    # CT / COUNT → per each
    if size_part.endswith(' CT') or size_part.endswith('CT') or size_part == 'CT':
        ct_str = size_part.replace('CT','').strip()
        try:
            ct_each = float(ct_str) if ct_str else 1.0
        except:
            ct_each = 1.0
        total_ct = qty * ct_each
        per_each = case_price / total_ct
        return per_each, f"per each ({pack_size})"

    # GRM / GRM → per gram packet
    if 'GRM' in size_part or 'GRM' in size_part:
        total = qty
        return case_price / total, f"per packet ({pack_size})"

    # OZ pieces → per piece
    if 'OZ' in size_part:
        return case_price / qty, f"per piece ({pack_size})"

    # CAN → per can
    if 'CAN' in size_part or '#10' in size_part or '#5' in size_part:
        return case_price / qty, f"per can ({pack_size})"

    # GAL → per gallon jug
    if 'GAL' in size_part or 'LGTR' in size_part:
        return case_price / qty, f"per {size_part.lower()} ({pack_size})"

    # ROLL, LTR, etc.
    return case_price / qty, f"per unit ({pack_size})"

# ── MATCH TABLE ─────────────────────────────────────────────────────────────
# Manual / semi-automatic match: count_prod_num → BEK item num
# (count_prod_num, bek_item_num)
MANUAL_MATCH = {
    "530572": "530572",
    "506121": "506121",
    "875138": "875138",
    "190557": "190557",
    "412862": "412862",
    "546495": "546495",
    "550400": "550400",
    "674189": "674189",
    "674216": "674216",
    "142365": "142365",
    "416047": "416047",
    "416072": "416072",
    "88518":  "416094",   # Cobbler Peach
    "226619": "226619",
    "216830": "216830",
    "398411": "398411",
    "182377": "182377",
    "107535": "107535",
    "112784": "112784",
    "115983": "115983",
    "111922": "111922",
    "111468": "111468",
    "779116": "779116",
    "453005": "453005",
    "797230": "797230",
    "158888": "158888",
    "168534": "168534",   # Cheesecake egg roll
    "138142": "138142",
    "145464": "145464",
    "2117":   "002117",   # Ham slices
    "190754": "190754",   # Jelly grape
    "TF756":  "677079",   # Jelly assorted
    "779123": "779123",   # Shortening
    "173619": "173619",   # Muffin cornbread (count #10884 → same product)
    "10884":  "173619",
    "797032": "797032",   # Gravy brown (count LJ574)
    "LJ574":  "797032",
    "677082": "677082",   # Jelly apple
    "142728": "142728",   # Cabbage green chunk
    "109014": "109014",   # Hushpuppy
    "LD094":  "109014",
    "131091": "131091",   # Mac & cheese
    "D0054":  "131091",
    "674626": "674626",   # Tartar sauce
    "L3892":  "674626",
    "HK012":  "191055",   # Smokies
    "370955": "370955",   # Pizza stix
    "65192":  "370955",
    "419055": "419055",   # Donut glazed
    "160977": "160977",   # Pizza puff taco
    "384952": "384952",   # Pizza puff ham & cheese
    "63472":  "384952",
    "384951": "384951",   # Pizza puff pepperoni
    "DL780":  "384951",
    "677217": "677217",   # Honey pc
    "R9238":  "677217",
    "G0222":  "380237",   # Egg roll pork & veg
    "D3558":  "412443",   # Cinnamon roll
    "125654": "125654",   # Tomato diced
    "90136":  "125654",
    "650547": "650547",   # Tomato diced w/chili
    "EV858":  "650547",
    "122730": "122730",   # Alfredo sauce
    "22826":  "122730",
    "301052": "301052",   # Rice parboiled
    "25204":  "301052",
    "170887": "170887",   # Mustard
    "TF782":  "170887",
    "112784": "112784",   # Buffalo sauce
    "159734": "159734",   # Chicken liver
    "159735": "159735",   # Chicken gizzard
    "108": "159735",
    "VB546":  "188915",   # Beef philly
    "LD472":  "188849",   # Beef steak fritter
    "188849": "188849",
    "188915": "188915",
    "BJ802":  "127990",   # Crispito buffalo
    "127990": "127990",
    "349493": "349493",   # Veg blend fajita
    "61634":  "349493",
    "229075": "229075",   # Sugar brown
    "J3166":  "229075",
    "170174": "170174",   # Squash yellow
    "M5268":  "170174",
    "123886": "123886",   # Soup cream chicken
    "LJ570":  "123886",
    "8515":   "301629",   # Cocktail sauce
    "NM660":  "146968",   # Ketchup dipping cup - closest is 146968 (9gram pc)
    "LP784":  "146968",   # Ketchup fancy foil
    "153064": "153064",   # Sausage pineapple
    "168310": "153064",
    "11692":  "370008",   # Corn dog chicken (count E5886 → 370008)
    "E5886":  "370008",
    "M8760":  "370013",   # Corn dog jalapeno
    "M4380":  "370049",   # Corn dog chili
    "VF328":  "534047",   # Pork choppette breaded
    "534047": "534047",
    "JE430":  "162490",   # Sausage link 4oz smoked
    "228934": "184380",   # Sausage smoked split
    "414312": "414312",   # Brownie
    "A4584":  "414312",
    "191055": "191055",
    "010670": "008128",   # Syrup pancake
    "10670":  "008128",
    "VD716":  "506121",   # Ground beef patty (close to 506121)
    "HC234":  "151017",   # Chicken breast grilled
    "151017": "151017",
    "P9350":  "012376",   # Peas field
    "H7222":  "157477",   # Gravy au jus
    "H7344":  "774492",   # Montreal steak seasoning
    "H7345":  "774492",
    "J5989":  "115570",   # Creole seasoning
    "115570": "115570",
    "25044":  "674216",   # Ranch dressing packet → ranch cup
    "LN574":  "779123",   # Shortening
    "LN102":  "119164",   # Flour hotel
    "119164": "119164",
    "693014": "693014",   # Fish fry breading
    "JC136":  "693014",
    "012376": "012376",
    "398411": "398411",
    "363433": "363433",   # Potato mashed
    "DV728":  "363433",
    "013936": "189661",   # Texas toast
    "13936":  "189661",
    "189661": "189661",
    "393106": "393106",   # Egg scrambled  -- not in count but here anyway
    "392490": "162490",
    "LN630":  None,       # Pepper black - not in BEK exactly
}

# ── COUNT SHEET DATA ─────────────────────────────────────────────────────────
# Each row: [unit, description, prod_num, pack_size, old_price]
COUNT_ROWS = [
    ["BAG","Appetizer Onion Ring 5/8\"","VC882","6/2.5Lb",9.01],
    ["BAG","Appetizer Potato Ring Frozen","LL720","6/4 Lb",8.66],
    ["CASE","Bacon 18-22 Single Sliced","530572","1/15 Lb",54.06],
    ["BOX","Bag Fry Paper","TB920","1/2000",22.41],
    ["BOX","Bag Sandwich Paper Dry Wax 6X.75X6.50 White Plain","875138","1/2000",44.53],
    ["BAG","Bean Baked Original Bacon Brown Sugar","190557","6/10can",8.44],
    ["CAN","Bean Green Whole Grade A IQF","61222","12/2 Lb",2.85],
    ["CASE","Bean Lima Baby IQF","RE098","1/20 Lb",34.94],
    ["CAN","Beans Green Cut 4-5 Sieve Extra Standard","CP656","6/#10Can",5.82],
    ["ROLL","Beef Ground 73/27 Chub Fine Refrigerated","VD716","8/10 Lb",42.50],
    ["CASE","Beef Ground Patty 3-1 75/25 Au Jus Frozen","506121","60/5.3Oz",84.52],
    ["CASE","Beef Philly Steak Sirloin Puck Frozen","VB546","48/4 Oz",83.22],
    ["CASE","Beef Steak Fritter Chopped Frozen Formed Breaded With Black Pepper","LD472","71/2.25",64.04],
    ["CASE","Box Barn Paper 10 Pound 8.88X5x6.75 White","63670","1/150Cnt",113.19],
    ["CASE","Box Carryout Chicken Fast Top 7X4x2.75 White","T6734","1/500Cnt",109.05],
    ["CASE","Box Paperboard Chicken 9X5x3 Fast Top White","EN814","1/400Cnt",131.34],
    ["LOAF","Bread Texas Toast White 3/4\" 20 Slice Frozen","13936","10/32 Oz",3.65],
    ["CASE","Breader Fish Fry Seasoned","JC136","1/25 Lb",32.93],
    ["CASE","Brownie Chocolate Chip 24 Slice Tray Thaw & Serve Frozen","A4584","48/4 Oz",48.96],
    ["CASE","Butter Unsalted European Style","11690","36/1 Lb",76.54],
    ["PACK","Bun Hot Dog 6\" Hinged Slice Baked Frozen","189664","12/12Cnt",3.19],
    ["PACK","Bun Plain 5\" Frozen","394690","64/3 Oz",3.19],
    ["CASE","Burrito Beef And Bean Red Chile Frozen","R5606","72/4 Oz",50.94],
    ["BAG","Cabbage Chopped 1X1 Fresh","75058","4/5 Lb",4.40],
    ["CAKE","Cake Carrot Momma's Old Fashioned 16 Slice Frozen","21572","2/114 Oz",55.12],
    ["","Cocktail Sauce","8515","100/1.5 Oz",28.60],
    ["","Blueberry Scones","","",50.52],
    ["","Marinara Sauce","","60/2 Oz",37.92],
    ["BAG","Candy Gummy Bear Mini 12 Flavor","NW282","4/5 Lb",18.42],
    ["CASE","Carrots Sliced","57966","1/20Lb",22.40],
    ["TRAY","Casserole Broccoli Cheese Rice Frozen","R7892","4/4.75Lb",5.31],
    ["TRAY","Casserole Hashbrown Ready To Bake Frozen","MR008","4/4.5 Lb",15.36],
    ["TRAY","Casserole Potato Baked Frozen","B2416","4/4.75Lb",12.50],
    ["SLEEVE","Cheese American Yellow .5 Ounce 160 Slice Easy Peel Refrigerated","70036","4/5 Lb",13.34],
    ["BAG","Cheese Cheddar Yellow Mild Feather Shredded Refrigerated","PK921","1/5 Lb",13.32],
    ["BAG","Cheese Mozzarella","FC276","6/5Lb",14.02],
    ["PACK","Cheese Pepper Jack Sliced Refrigerated","PK910","4/2.5 Lb",9.10],
    ["PACK","Cheese Swiss Sliced 192 Refrigerated","PK940","6/24 Oz",6.27],
    ["CAKE","Cheesecake Cinnamon Churro Frozen","JV088","2/14 Sl",47.50],
    ["BAG","Chicken Breast 4 Ounce Grilled Fully Cooked Grill Marked Frozen","HC234","2/5 Lb",33.87],
    ["CASE","Chicken Breast Patty Fritter Homestyle Ready To Cook Avg 3.2 Oz","138142","2/5",24.52],
    ["SLEEVE","Chili","","",17.80],
    ["","Chicken Egg Roll","","100/3 Oz",77.58],
    ["CASE","Chicken Tender Jumbo Clipped All Natural Controlled Vac Pack Refrigerated","550400","4/10 Lb",90.16],
    ["CONTAINER","Cinnamon","20084","6/15Oz",17.14],
    ["TRAY","Cobbler Apple Frozen","416047","4/6 Lb",10.29],
    ["BOX","Cheese Cake Egg Roll","168534","100/2.5oz",72.10],
    ["TRAY","Cobbler Cherry Frozen","416072","4/5 Lb",11.39],
    ["TRAY","Cobbler Peach Frozen","88518","4/5 Lb",12.54],
    ["CONTAINER","Coleslaw Creamy","ABJ16","2/4.5 Lb",9.89],
    ["CONTAINER","Coleslaw Dixie Chopped With Mayonnaise Refrigerated","M5484","2/11 Lb",23.41],
    ["BOX","Cone Cake #30 Dispenser Pack","11492","6/100Cnt",12.11],
    ["ROW","Cone Waffle Large Bulk","10556","12/16Cnt",5.26],
    ["SLEEVE","Container Foam 12 Ounce Squat White","79346","20/25Cnt",1.49],
    ["SLEEVE","Container Foam 16 Ounce Squat White","79400","20/25Cnt",1.67],
    ["SLEEVE","Container Foam 6 Ounce Squat White","79342","20/50Cnt",1.99],
    ["SLEEVE","Container Foam 8 Ounce Squat White","79372","20/50Cnt",2.43],
    ["SLEEVE","Container Foam 3 Compartment 9X9x3 Large Hinged White","DW324","2/100Cnt",10.30],
    ["SLEEVE","Container Foam Sandwich 1 Compartment Large 6X6x3 Hinged White","EG086","4/125Cnt",6.57],
    ["SLEEVE","Container Hot Cold Paper 8 Ounce White","P9632","20/50Cnt",2.93],
    ["SLEEVE","Container Paper 12 Ounce White","TG366","20Cnt",4.78],
    ["SLEEVE","Container Plastic 6X5.75X3 Square Clear Hinged Polystyrene","G0826","4/125Cnt",11.64],
    ["SLEEVE","Container Plastic Hinged Large Cake Slice Side View Clear","HL912","1/240Cnt",104.15],
    ["SLEEVE","Container Sandwich Plastic 5.38X2.58X5.25 Clear Hinged","H8042","4/125Cnt",13.39],
    ["CASE","Cookie Dough Decadent Red Velvet Frozen","P6798","80/4.5Oz",84.08],
    ["CASE","Corn Dog Cheese Jalapeno With Bag Frozen","M8760","36/4.25",27.54],
    ["CASE","Corn Dog Chicken Battered Honey Crunch On Stick Frozen","E5886","72/4.25",43.55],
    ["CASE","Corn Dog Chili Lovers With Bag Frozen","M4380","36/4.25",29.18],
    ["CAN","Corn Whole Kernel Fancy Low Sodium","CP638","6/#10Can",6.12],
    ["CASE","Craisin Dried Sugar Added","34112","1/10 Lb",28.94],
    ["CASE","Crispito Chicken Cheese Buffalo Style Fully Cooked Frozen","BJ802","72/2.75",57.39],
    ["SLEEVE","Cup 9 Ounce Squat Clear PET","LK514","20/50Cnt",3.90],
    ["CASE","Cutlery Kit Knife Fork Spoon Salt & Pepper Heavy Wt Black","TJ340","1/250Cnt",25.68],
    ["CASE","Donut Apple","","",33.26],
    ["CASE","Dough Biscuit Southern Style Buttermilk Unsliced Easy Split Frozen","412862","168/3.17",53.87],
    ["","Glazed Donuts","","",54.76],
    ["","Pink Donuts","","",29.32],
    ["CASE","Crackers","","",24.90],
    ["CASE","Dough Cookie Chocolate Chip Pre-Portioned Bake & Serve Frozen","C2002","160/2 Oz",62.85],
    ["CASE","Dough Cookie Decorated Sugar Pre-Portioned Bake & Serve Frozen","57030","80/4.5Oz",79.22],
    ["CASE","Dough Cookie Peanut Butter Frozen","JL998","160/2 Oz",72.76],
    ["CASE","Dough Cookie White Chocolate Macadamia Nut Decadent Frozen","57402","80/4.5Oz",93.48],
    ["CASE","Dough Roll Cinnamon Cinn-Sational Frozen","D3558","108/5 Oz",72.46],
    ["CASE","Dressing Honey Mustard Portion Cup Refrigerated","674189","100/1.5",28.31],
    ["CASE","Dressing Ranch Packet","25044","60/1.5Oz",18.39],
    ["CASE","Dressing Ranch Portion Control Cup Refrigerated","674216","100/1.5",26.64],
    ["FLAT","Egg Shell On White Medium Grade Aa Loose Pack Refrigerated","142365","1/30 Dz",2.04],
    ["CASE","Eggroll Pork And Vegetable Frozen","G0222","72/3 Oz",53.08],
    ["CONTAINER","Flavoring Vanilla","29095","6/32Oz",11.46],
    ["BAG","Flour Hotel & Restaurant All Purpose","LN102","1/25 Lb",12.43],
    ["BOX","Foil Aluminum Sheet 9X10.75 Interfold","83238","6/500Cnt",17.27],
    ["CAN","Food Release Oil Base Pan Spray","EB744","6/17Oz",4.82],
    ["CAN","Food Release Canola Sunflower Soybean All Purpose Spray Aerosol","25114","6/14 Oz",5.32],
    ["BOX","Fork Plastic Heavy Weight Black Polypropylene Max Stax Refill","NE822","1/1000Ea",48.15],
    ["BAG","Fries Potato Wedge Seasoned 8 Cut Frozen","216830","6/5 Lb",8.52],
    ["CONTAINER","Garlic Granulated","CE570","1/7.25Lb",55.95],
    ["BAG","Ice Cream Chocolate Mix","14696","6/64 Oz",14.00],
    ["PAIL","Glaze Donut Honey Dip Pail Frozen","WE754","1/12 Lb",29.75],
    ["BAG","Gravy Mix Au Jus","H7222","16/3.3Oz",2.14],
    ["BAG","Gravy Mix Biscuit Pepper No Msg Added","797230","6/24 Oz",4.48],
    ["BAG","Gravy Mix Brown","LJ574","8/16 Oz",5.23],
    ["CAN","Greens Turnip Seasoned","NL960","6/#10Can",7.13],
    ["BAG","Grits White Quick Enriched","18880","8/5 Lb",3.63],
    ["PACK","Ham For Biscuit Slice 1.2 Ounce Frozen","2117","12/1lb",26.17],
    ["CASE","Honey Pure Grade A Portion Cup","R9238","200/.5Oz",34.62],
    ["CASE","Hot Pocket Pizza Stix Pepperoni Mozzarella Cheese Fry Or Oven Bulk Frozen","65192","48/3 Oz",32.61],
    ["BAG","Hushpuppy Original Buttermilk .66 Ounce","LD094","4/5 Lb",11.91],
    ["JUG","","","",4.36],
    ["JUG","Ice Cream Vanilla Mix","1492","6",13.17],
    ["CASE","Jam Strawberry Packet","GR320","200/.5Oz",25.67],
    ["CASE","Jelly Assorted #3 Cup 80 Grape 40 Apple 80 Mixed Fruit","TF756","200/.5Oz",17.79],
    ["CASE","Jelly Grape Pouch","190754","200/.5Oz",20.64],
    ["","Apple Jelly","","200/.5Oz",15.28],
    ["CASE","Ketchup Dipping Cup","NM660","250/1 Oz",37.30],
    ["CASE","Ketchup Fancy Foil","LP784","1000/9Gm",27.51],
    ["BOX","Knife Plastic Heavy Weight Black Polypropylene Max Stax Refill","NE818","1/1000Ea",48.15],
    ["TRAY","Lasagna","","",24.75],
    ["SLEEVE","Lid Container 6 oz","VV490","20/50Cnt",4.51],
    ["SLEEVE","Lid Container 12oz","79374","10/100",3.01],
    ["SLEEVE","Lid Plastic Dome Container 8 Ounce Clear","LV886","20/50Cnt",3.97],
    ["SLEEVE","Lid Plastic Dome 12 oz","VV490","20/50Cnt",4.51],
    ["BAG","Macaroni And Cheese Boil In Bag Frozen","D0054","4/5 Lb",13.19],
    ["CASE","Margarine Spread Whipped Vegetable Oil 48% Portion Cup","C4556","648/14Gm",56.03],
    ["JUG","Mayonnaise Heavy Duty Jug","LW776","4/1Gal",10.02],
    ["CASE","Mayonnaise Pouch","182377","200/9 Gm",17.09],
    ["EACH","Meatloaf Beef Ready To Cook Frozen","BA292","3/5 Lb",24.66],
    ["CASE","Muffin Corn Frozen","10884","96/2.125",40.70],
    ["CASE","Muffin Variety (Banana Nut, Blueberry Cobbler, Chocolate Chunk, Cinnamon Walnut Streusel)","V7108","48/4.25",58.06],
    ["CASE","Mustard Yellow Portion Pack","TF782","500/5.5G",7.85],
    ["PACK","Napkins 13X8.5","DT310","12/500",5.22],
    ["JUG","Oil Butter Flavor Whirl","779116","3/1 Gal",10.36],
    ["BAG","Okra Lightly Breaded Frozen","226619","4/5 Lb",9.33],
    ["CASE","Onion Yellow Large Fresh","DT132","1/5 Lb",7.64],
    ["CASE","Catfish Nuggets","453005","1",94.75],
    ["CONTAINER","Parsley Flakes","CE804","6/2Oz",8.38],
    ["BAG","Pasta Macaroni","24806","3/10Lb",12.94],
    ["BAG","Pasta Penne Rigate #49 Imported","CK276","2/10 Lb",12.77],
    ["BAG","Pasta Spaghetti 10\"","25186","2/10 Lb",12.91],
    ["CASE","Peas Field With Snap Frozen","P9350","1/20 Lb",37.24],
    ["BAG","Pepper Black Ground .1Gm Flute Pack","LN630","6/1000",7.42],
    ["SHAKER","Pepper Black Shaker Grind 34 Mesh","CE624","1/5 Lb",40.00],
    ["JUG","Peppers Jalapeno Whole","R3644","4/1Gal",11.40],
    ["JUG","Pickle Chip","12822","4/1Gal",8.58],
    ["SLEEVE","Plate Foam 3 Compartment","197491","4/125 Cnt",7.35],
    ["CASE","Pork Chop 4 Ounce Boneless Center Cut Enhanced Frozen","145464","40/4 Oz",55.41],
    ["CASE","Pork Choppette Breaded Frozen","VF328","40/4 Oz",35.46],
    ["BAG","Pork Pulled With Barbecue Sauce Fully Cooked Heat In Bag Frozen","546495","2/5 Lb",30.28],
    ["EACH","Pork Spare Rib Street Louis Fully Cooked Seasoned","AHR78","10/2.5Av",15.61],
    ["BAG","Potato Mashed Deluxe With Pepper Refrigerated","DV728","4/5 Lb",10.75],
    ["CASE","Puff Pastry Ham And Cheese Frozen","63472","48/6 Oz",80.43],
    ["CASE","Puff Pizza Pepperoni 6 Ounce Frozen","DL780","48/6 Oz",69.35],
    ["BOX","Rice Jambalaya Mix","E0762","8/2.5 Lb",9.62],
    ["CASE","Rice Long Grain Parboiled Boxed","25204","1/25 Lb",17.86],
    ["PACK","Roll Dinner Hawaiian Sweet Frozen","398411","10/24Cnt",5.75],
    ["EACH","Salad Bowl BLT","59147","6/4Oz",2.84],
    ["CONTAINER","Salad Pasta Italian Tri-Color Rotini Refrigerated","72122","2/8 Lb",23.94],
    ["CONTAINER","Salt Garlic","CE752","6/37Oz",15.99],
    ["ROUND","Salt Iodized Round","1100","24/26Oz",0.86],
    ["BAG","Sauce Alfredo Frozen","22826","4/64 Oz",13.44],
    ["CASE","Sauce Barbecue Original","111922","4/1 Gal",13.49],
    ["CASE","Sauce Barbecue Original Portion Cup","107535","100/1.5",26.06],
    ["CAN","Sauce Cheese Cheddar Trans Fat Free","VG558","6/#10Can",8.81],
    ["CASE","Sauce Cocktail","8515","100/1.5",29.95],
    ["CASE","Sauce Hot Original Packet Texas Pete","81432","200/7 Gm",14.55],
    ["CAN","Sauce Spaghetti From Concentrate","12056","6/#10Can",6.72],
    ["CASE","Sauce Sweet And Sour Cup","115983","100/1 Oz",19.86],
    ["JUG","Sauce Sweet Red Chili And Glaze","M0760","4/1 Gal",18.74],
    ["CASE","Sauce Tartar Portion Cup Refrigerated","L3892","100/.75",31.45],
    ["JUG","Sauce Wing Buffalo","112784","4/1gal",15.18],
    ["CASE","Sausage Link 4-1 Smoked Frozen","JE430","40/4 Oz",48.42],
    ["CASE","Sausage Original Link Smoked Split Frozen","228934","64/2.5Oz",61.99],
    ["CASE","Sausage Patty Special Recipe Fully Cooked Frozen","111468","80/2 Oz",48.46],
    ["PACK","Sausage Pork Patty Fully Cooked Jalapeno Smoked Cheddar","AFW74","2/5 Lb",24.98],
    ["CASE","Sausage Smokies Link 5\" Hickory Smoked Collagen Casing Frozen","HK012","1/10 Lb",48.57],
    ["CONTAINER","Seasoning Blend Montreal Steak Grill Mates","H7344","6/29 Oz",13.48],
    ["CONTAINER","Seasoning Blend Montreal Steak Grill Mates","H7345","1/29 Oz",15.53],
    ["JUG","Seasoning Creole Original","J5989","1/8 Lb",20.90],
    ["JUG","Shortening Clear Liquid Fry","LN574","1/35 Lb",35.62],
    ["BAG","Shrimp White 31-40 Raw Peeled Deveined Tail Off Phosphate Free IQF","158888","5/2 Lb",12.57],
    ["BOX","Skewer Wooden Bamboo","P0666","3/500Cnt",13.24],
    ["CAN","Soup Cream Of Chicken","LJ570","12/50 Oz",5.96],
    ["CAN","Soup Cream of Mushroom","","",5.79],
    ["BOX","Spoon Plastic Heavy Weight Black Polypropylene Max Stax Refill","NE820","1/1000Ea",48.15],
    ["BOX","Spoons Wrapped","","",20.29],
    ["BAG","Squash Yellow Sliced Smooth IQF","M5268","12/32 Oz",3.02],
    ["BAG","Sugar Brown Light Cane","J3166","12/2 Lb",2.96],
    ["CASE","Syrup Breakfast Maple Imitation 1.4 Ounce Portion Cup","10670","100/1.4",16.18],
    ["CAN","Syrup Chocolate Full Flavor Ready To Use","19856","6/#10Can",12.62],
    ["CAN","Tomato Diced 3/4\" In Juice Extra Standard","90136","6/#10Can",5.13],
    ["CAN","Tomato Diced With Green Chili","EV858","12/28 Oz",2.24],
    ["BAG","Topping Butterfinger Chopped Refrigerated","V9432","2/5 Lb",24.08],
    ["CAN","Topping Butterscotch Ready To Use","B9632","6/#5 Can",8.52],
    ["BAG","Topping Candy Rainbow Nerds Wonka","B8538","2/5 Lb",27.28],
    ["CAN","Topping Caramel","31474","6/66 Oz",12.03],
    ["BAG","Topping Heath Bar Chopped Refrigerated","20562","2/5 Lb",34.06],
    ["BAG","Topping M&M's Plain Chopped Refrigerated","H1838","2/4 Lb",21.56],
    ["CAN","Topping Marshmallow Ready To Use","75832","6/36 Oz",7.66],
    ["CAN","Topping Peanut Pieces Salted","BF680","6/2.5 Lb",12.37],
    ["CASE","Topping Reeses Pieces Mini Bulk","28498","1/25 Lb",122.75],
    ["BAG","Vegetable Blend Red & Green Pepper Onion Strip Roasted Frozen","61634","6/2.5 Lb",4.66],
    ["BOX","Wrap Deli 8X10.75 Interfolded","22536","12/500",6.56],
    ["BOX","Wrap Deli 12X10.75","AAG18","12/500",6.80],
    ["BOX","Wrap Foil 14X10.5 Cushion Plain","83942","5/500Cnt",29.66],
    ["PACK","Pineapple Sausage","168310","14/12oz",4.97],
    ["EACH","Lettuce Head","","",3.99],
    ["EACH","Tomato","","",2.49],
    ["BAG","Creole Marinade","","",1.81],
    ["BAG","Spicy Marinade","","",5.27],
    ["BAG","Batter Mix","","",3.30],
    ["BAG","Batter Mix","","",2.50],
    ["PACK","Bayou Blend Pork","","5 Packs",7.48],
    ["PACK","Bayou Blend Alligator","","5 Pack",9.89],
    ["PACK","Bayou Blend Crawfish","","5 Packs",9.10],
    ["PACK","Bayou Blend Shrimp","","5 Packs",8.08],
    ["CAN","Peanuts Regular/Cajun","","6 Cans",8.33],
    ["SLEEVE","16oz Peanut Cup","","20 Sleeves",8.01],
    ["SLEEVE","32oz Peanut Cup","","20 Sleeves",10.22],
    ["SLEEVE","Peanut Cup Lid","","10 Sleeves",5.01],
    ["BAG","Gizzards","","4/Box",19.80],
    ["BAG","Livers","","4/Box",14.78],
    ["BAG","Brisket","","",29.44],
    ["CASE","Kolache Boudin Link Org","","",69.77],
    ["CASE","Kolache Sausage Egg & Cheese","","",69.77],
    ["CASE","Wrap Jalapeno Popper","","",93.03],
    ["CASE","Deer Burrito","","",449.00],
    ["CASE","Jalapeno Cheddar Kolache","","",69.77],
    ["CASE","Chicken Fajita","","",57.99],
    ["BAG","Mac And Cheese","","6 Bags",7.10],
    ["BAG","Mashed Potatoes","","4 Bags",9.64],
    ["CASE","Mini Taco Beef","","case",27.91],
    ["CASE","Mini Taco Chicken","","case",27.91],
    ["BAG","Red Beans","","9 Bags",6.49],
    ["PACK","Beef Sausage Dogs","","",20.34],
    ["BAG","Seasoned Corn","","6 Bags",6.18],
    ["CASE","Stuffed Nacho","","case",37.28],
    ["BAG","Tomato Gravy","","4 bags",12.34],
    ["CASE","Spicy Chicken Patty","","",52.87],
    ["EACH","Crooked Letter Cookies","","",1.90],
    ["EACH","Strawberry/Blueberry Cream Cheese King Cake","","",31.00],
    ["EACH","Traditional King Cake","","",26.00],
    ["EACH","Cream Cheese King Cake","","",28.00],
    ["EACH","Pecan Praline King Cake","","",30.00],
]

# Supplement manual matches with additional name-based keys
EXTRA_MATCHES = {
    "81432": "674170",   # Hot sauce packet → Texas Pete
    "NL960": "113975",   # Greens turnip
    "18880": "799424",   # Grits white
    "G0222": "380237",   # Egg roll pork
    "JE430": "162490",   # Sausage link smoked
    "P9350": "012376",   # Peas field
    "VG558": "184643",   # Cheese sauce cheddar
    "R3644": "685002",   # Jalapeno whole
    "197491": None,      # Foam plate - not in BEK
    "H7222": "157477",   # Gravy au jus
    "CE804": "774726",   # Parsley
    "J5989": "115570",   # Creole seasoning
    "11690": "389120",   # Butter unsalted
    "LW776": "119451",   # Mayonnaise
}
MANUAL_MATCH.update(EXTRA_MATCHES)

# ── BUILD OUTPUT ──────────────────────────────────────────────────────────────
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "DELI COUNT"

# Colors
YELLOW  = PatternFill("solid", fgColor="FFFF00")   # price increased
GREEN   = PatternFill("solid", fgColor="C6EFCE")   # price decreased
RED_BG  = PatternFill("solid", fgColor="FFC7CE")   # significant increase
GRAY    = PatternFill("solid", fgColor="D9D9D9")   # header
BLUE_H  = PatternFill("solid", fgColor="BDD7EE")   # section header
WHITE   = PatternFill("solid", fgColor="FFFFFF")

bold = Font(bold=True)
center = Alignment(horizontal="center", vertical="center", wrap_text=True)
left   = Alignment(horizontal="left",  vertical="center", wrap_text=True)

thin = Side(border_style="thin", color="000000")
border = Border(left=thin, right=thin, top=thin, bottom=thin)

def cell(ws, row, col, value, fill=None, font=None, align=None, num_fmt=None):
    c = ws.cell(row=row, column=col, value=value)
    if fill:   c.fill = fill
    if font:   c.font = font
    if align:  c.alignment = align
    if num_fmt: c.number_format = num_fmt
    c.border = border
    return c

# Header row
headers = [
    "UNIT","BEK ITEM #","PRODUCT DESCRIPTION (BEK NAME)","OLD DESCRIPTION",
    "PACK/SIZE","PAR","BEK CASE PRICE","OLD PRICE","PRICE CHG $","PRICE CHG %",
    "PRICE PER UNIT","UNIT LABEL",
    "ON HAND","TOTAL",
    "INV/ORD 1","INV/ORD 2","INV/ORD 3","INV/ORD 4","INV/ORD 5"
]
for ci, h in enumerate(headers, 1):
    c = ws.cell(row=1, column=ci, value=h)
    c.fill = GRAY
    c.font = bold
    c.alignment = center
    c.border = border

# Column widths
col_widths = [8,10,40,38,14,5,13,12,11,11,14,22,10,12,10,10,10,10,10]
for ci, w in enumerate(col_widths, 1):
    ws.column_dimensions[get_column_letter(ci)].width = w
ws.row_dimensions[1].height = 30

# Fill rows
for ri, row in enumerate(COUNT_ROWS, 2):
    unit, old_desc, prod_num, pack_size, old_price = row

    # Try to find BEK match
    bek = None
    if prod_num:
        bek = bek_by_num.get(prod_num) or (bek_by_num.get(MANUAL_MATCH.get(prod_num)) if MANUAL_MATCH.get(prod_num) else None)

    if bek:
        bek_num   = bek[0]
        bek_name  = bek[1]
        bek_brand = bek[2]
        bek_pack  = bek[3]
        bek_price = bek[4]
    else:
        bek_num   = prod_num
        bek_name  = old_desc
        bek_brand = ""
        bek_pack  = pack_size
        bek_price = old_price

    # Per-unit price
    per_unit_price, unit_label = parse_per_unit(bek_pack, bek_price)

    # Price change
    if bek_price and old_price and old_price > 0:
        # Normalize: if old_price looks like a sub-unit price, scale it
        # Determine if old_price was the case price or per-unit
        # Heuristic: if old_price * count_in_pack ≈ bek_case_price, old was per-unit
        delta     = bek_price - old_price
        pct       = delta / old_price * 100
        price_chg = delta
        price_pct = pct
    else:
        price_chg = None
        price_pct = None

    # Determine fill based on price change
    if price_chg is not None and abs(price_chg) > 0.05:
        if price_chg > 0:
            fill = YELLOW if price_chg < 5 else RED_BG
        else:
            fill = GREEN
    else:
        fill = None

    vals = [
        unit,
        bek_num if bek else prod_num,
        bek_name,
        old_desc if bek else "",
        bek_pack,
        1,
        bek_price,
        old_price,
        price_chg,
        price_pct,
        per_unit_price,
        unit_label,
        None,  # on hand
        None,  # total
        None, None, None, None, None,
    ]

    for ci, val in enumerate(vals, 1):
        c = ws.cell(row=ri, column=ci, value=val)
        c.border = border
        if fill:
            c.fill = fill
        c.alignment = left if ci in (3,4,12) else center

        # Number formats
        if ci in (7,8):   # prices
            c.number_format = '$#,##0.00'
        elif ci == 9:     # price chg $
            c.number_format = '+$#,##0.00;-$#,##0.00'
        elif ci == 10:    # pct
            c.number_format = '+0.0%;-0.0%'
            if val is not None:
                c.value = val / 100  # fraction for percent format
        elif ci == 11:    # per unit
            c.number_format = '$#,##0.0000'
        elif ci == 14:    # total
            if val is None:
                # formula: ON_HAND * CASE_PRICE
                oh_col  = get_column_letter(13)
                cp_col  = get_column_letter(7)
                c.value = f"={oh_col}{ri}*{cp_col}{ri}"
                c.number_format = '$#,##0.00'

# ── LEGEND ────────────────────────────────────────────────────────────────────
legend_row = len(COUNT_ROWS) + 3
ws.cell(row=legend_row, column=1, value="LEGEND:").font = bold
items = [
    (RED_BG, "PRICE INCREASE > $5.00"),
    (YELLOW, "PRICE INCREASE"),
    (GREEN,  "PRICE DECREASED"),
    (None,   "NO CHANGE / NOT IN BEK LIST"),
]
for i, (fill, label) in enumerate(items):
    c = ws.cell(row=legend_row + i + 1, column=1, value=label)
    if fill: c.fill = fill
    c.border = border

# Freeze header row
ws.freeze_panes = "A2"

# ── FOUNTAIN COUNT sheet (unchanged) ─────────────────────────────────────────
ws2 = wb.create_sheet("FOUNTAIN COUNT")
fount_headers = ["PRODUCT","SIZE/DESCRIPTION","ON HAND (QTY)","COST","TOTAL"]
for ci, h in enumerate(fount_headers, 1):
    c = ws2.cell(row=1, column=ci, value=h)
    c.fill = GRAY
    c.font = bold
    c.alignment = center
    c.border = border

fount_data = [
    ("SIGNATURE BLEND","CASE",1.5,None),
    ("AMERICAN CLASSIC","CASE",1.75,None),
    ("PECAN PRALINE","CASE",1.5,None),
    ("BREAKFAST BLEND","CASE",1.75,None),
    ("DB ESPRESSO","CASE",2.0,None),
    ("Creamer Cups (Irish Cream, French Vanilla, Caramel)","CASE",3.5,None),
    ("Coffee Mate","CASE",0,None),
    ("Sweet Cream Creamer","CASE",1.0,None),
    ("Hazelnut Creamer","CASE",1.1,None),
    ("Half And Half","CASE",2.0,None),
    ("Original Creamer","CASE",1.25,None),
    ("Caramel Syrup Pump","BOTTLE",1.5,None),
    ("Hazelnut Syrup Pump","BOTTLE",1.5,None),
    ("French Vanilla Syrup Pump","BOTTLE",1.0,None),
    ("Hold & Go Lids 12-24oz","SLEEVE",14,None),
    ("Lid SW 16/20oz","SLEEVE",None,None),
    ("Cappuccino French Vanilla","BAG",9,None),
    ("Sugar Free Cappuccino French Vanilla","BAG",8,None),
    ("Hot Chocolate","BAG",11,None),
    ("Creamer Packs","CASE",1.0,None),
    ("Sugar Pack","CASE",1.0,None),
    ("Blue Sweetener","CASE",0.75,None),
    ("Yellow Sweetener","CASE",0.25,None),
    ("Pink Sweetener","BAG",1.0,None),
    ("Sugar Packets","EACH",45,None),
    ("Sugar Canister","EACH",39,None),
    ("Red Stirrers","PACK",3.5,None),
    ("16 oz Double-Wall Cup","SLV",32,None),
    ("16oz Single-Wall Cup","SLV",None,None),
    ("24 oz Double-Wall Cup","SLV",37,None),
    ("32oz Fountain Cup","SLV",63,None),
    ("32oz Lid","SLV",61,2.85),
    ("20oz Cup","SLV",81,None),
    ("20oz Lid","SLV",56,None),
    ("Red Straws","BOX",12,None),
    ("Bag In Box 5 Gal Syrup","BOX",2,None),
    ("Bag In Box 2.5 Gal Syrup","BOX",5,None),
    ("CO2 Tank","EACH",3,None),
    ("Cafe Tango Lids","SLEEVE",6,2.53),
    ("16 oz Tango Cup","SLV",8,6.78),
    ("24 oz Tango Cup","SLV",5,None),
    ("Cafe Tango French Vanilla","BAG",2,13.64),
    ("Cafe Tango Mocha","BAG",25,None),
    ("Caramel Macchiato","BAG",14,None),
]

fount_col_widths = [38,16,14,12,14]
for ci, w in enumerate(fount_col_widths, 1):
    ws2.column_dimensions[get_column_letter(ci)].width = w

for ri, (prod, size, qty, cost) in enumerate(fount_data, 2):
    for ci, val in enumerate([prod, size, qty, cost, None], 1):
        c = ws2.cell(row=ri, column=ci, value=val)
        c.border = border
        c.alignment = left if ci in (1,2) else center
        if ci == 4 and val:
            c.number_format = '$#,##0.00'
        if ci == 5 and qty is not None and cost is not None:
            c.value = f"={get_column_letter(3)}{ri}*{get_column_letter(4)}{ri}"
            c.number_format = '$#,##0.00'

ws2.freeze_panes = "A2"
ws2.row_dimensions[1].height = 20

# Save
out = "/home/user/Keith-s-Superdeli/Updated_185_Count_Sheet_BEK.xlsx"
wb.save(out)
print(f"Saved: {out}")
