(function () {
  "use strict";

  window.WorldZooRoster = [
    {
      id: "forest",
      title: "もりのなかま",
      scene: "assets/scenes/area-forest-animals-v1.webp",
      icon: "🌲",
      description: "きぎの あいだで くらす なかま",
      available: true,
      tablets: [
        { number: 1, title: "もりのせきばん１", ids: ["squirrel", "deer", "bear"], difficulty: 1, copy: "みじかい なまえから はじめよう" },
        { number: 2, title: "もりのせきばん２", ids: ["fox", "mouse", "wolf"], difficulty: 2, copy: "まがる みちも よく みよう" },
        { number: 3, title: "もりのせきばん３", ids: ["hamster", "hedgehog", "sloth", "red_panda"], difficulty: 3, copy: "ながい なまえを つなげよう" },
        { number: 4, title: "もりのせきばん４", ids: ["dog", "cat", "rabbit", "mole"], difficulty: 3, copy: "みじかい なまえを すばやく みつけよう" },
        { number: 5, title: "もりのせきばん５", ids: ["raccoon_dog", "guinea_pig", "armadillo"], difficulty: 3, copy: "ながい なまえの まがりみちを たどろう" },
      ],
      animals: [
        {
          id: "dog", name: "いぬ", playable: true, order: 11, tablet: 4,
          fact: "いぬには おおきさや かお、けの ちがう たくさんの しゅるいが いるよ。",
          quote: "ぼくと ちがう すがたの いぬにも、あってみてね！",
        },
        {
          id: "cat", name: "ねこ", playable: true, order: 12, tablet: 4,
          fact: "ねこの ひげは、ちかくの ものや せまい すきまを たしかめる センサーのような やくめを するよ。",
          quote: "くらい ところでも、ひげで そっと たしかめるよ。",
        },
        {
          id: "rabbit", name: "うさぎ", playable: true, order: 13, tablet: 4,
          fact: "うさぎの まえばは いっしょう のびつづけるよ。くさや ほしくさを かんで すりへらすんだ。",
          quote: "まえばの おていれには、ほしくさが いちばん！",
        },
        {
          id: "bear", name: "くま", playable: true, order: 3, tablet: 1,
          fact: "くまは はなが よく、においを たよりに たべものや なかまを みつけるよ。",
          quote: "いい においが する！ なにが あるのかな？",
        },
        {
          id: "fox", name: "きつね", playable: true, order: 4, tablet: 2,
          fact: "きつねの ふさふさした しっぽは、はしるときの バランスとりや さむいときに やくだつよ。",
          quote: "この しっぽ、じまんなんだ。",
        },
        {
          id: "raccoon_dog", name: "たぬき", playable: true, order: 15, tablet: 5,
          fact: "たぬきは あらいぐまに にているけれど、いぬや きつねと おなじ いぬかの なかまだよ。",
          quote: "かおは そっくりでも、あらいぐまじゃ ないんだよ。",
        },
        {
          id: "deer", name: "しか", playable: true, order: 2, tablet: 1,
          fact: "しかの おおきな みみは、いろいろな むきの おとを きくのに やくだつよ。",
          quote: "もりの おとを、いっしょに きいてみよう。",
        },
        {
          id: "wolf", name: "おおかみ", playable: true, order: 6, tablet: 2,
          fact: "おおかみは とおくの なかまに つたえるため、ながく ひびく こえで とおぼえを するよ。",
          quote: "なかまに ただいまって つたえるね。",
        },
        {
          id: "squirrel", name: "りす", playable: true, order: 1, tablet: 1,
          fact: "りすの なかまには、きのみを じめんに うめて かくすものが いるよ。わすれた きのみから めが でることもあるんだ。",
          quote: "ぼくの きのみが、もりの きになったのかな？",
        },
        {
          id: "hedgehog", name: "はりねずみ", playable: true, order: 8, tablet: 3,
          fact: "はりねずみの はりは、かたくなった け。びっくりすると からだを まるめて みを まもるよ。",
          quote: "もう あんしん。はりも ふんわり みえるでしょ？",
        },
        {
          id: "mole", name: "もぐら", playable: true, order: 14, tablet: 4,
          fact: "もぐらは スコップのような おおきな まえあしで、つちを ほって トンネルを つくるよ。",
          quote: "モグタン、ひさしぶりだねぇ。",
        },
        {
          id: "mouse", name: "ねずみ", playable: true, order: 5, tablet: 2,
          fact: "ねずみは ひげで まわりを たしかめて、くらい ところや せまい みちも すすむよ。",
          quote: "ひげが ぴくぴく。みちは こっちだよ！",
        },
        {
          id: "hamster", name: "はむすたー", playable: true, order: 7, tablet: 3,
          fact: "はむすたーは ほおぶくろに たべものを いれて、すあなまで はこぶよ。",
          quote: "ほっぺの なかは、ひみつの かばん！",
        },
        {
          id: "guinea_pig", name: "もるもっと", playable: true, order: 16, tablet: 5,
          fact: "もるもっとの あしの ゆびは、まえに4ほんずつ、うしろに3ほんずつ。ぜんぶで14ほんだよ。",
          quote: "あしの ゆび、いっしょに かぞえてみる？",
        },
        {
          id: "sloth", name: "なまけもの", playable: true, order: 9, tablet: 3,
          fact: "なまけものの なかには、けに ちいさな そうるいが ついて みどりいろに みえるものも いるよ。",
          quote: "ゆっくりでも、ちゃんと すすんでいるよ。",
        },
        {
          id: "red_panda", name: "れっさーぱんだ", playable: true, order: 10, tablet: 3,
          fact: "れっさーぱんだは ながい しっぽで バランスを とり、さむいときは からだに まきつけるよ。",
          quote: "しましまの しっぽ、あったかいよ。",
        },
        {
          id: "armadillo", name: "あるまじろ", playable: true, order: 17, tablet: 5,
          fact: "あるまじろの かたい こうらは、つよい ほねの いたで できているよ。",
          quote: "かたい こうらが、ぼくの よろいだよ。",
        },
      ],
    },
    {
      id: "grassland",
      title: "そうげんのなかま",
      scene: "assets/scenes/area-grassland-animals-v1.webp",
      icon: "🌾",
      description: "ひろい そうげんや ぼくじょうの なかま",
      available: true,
      tablets: [
        { number: 1, title: "そうげんのせきばん１", ids: ["elephant", "giraffe", "tiger", "rhinoceros"], difficulty: 1, copy: "みじかい なまえを ひろい そうげんで さがそう" },
        { number: 2, title: "そうげんのせきばん２", ids: ["lion", "zebra", "hippo"], difficulty: 2, copy: "しまもようと おおきな くちの なかまを さがそう" },
        { number: 3, title: "そうげんのせきばん３", ids: ["koala", "kangaroo", "monkey"], difficulty: 3, copy: "ながい なまえの まがりみちを たどろう" },
        { number: 4, title: "そうげんのせきばん４", ids: ["sheep", "goat", "cow", "pig"], difficulty: 3, copy: "まきばの なかまを すばやく みつけよう" },
        { number: 5, title: "そうげんのせきばん５", ids: ["panda", "gorilla", "platypus"], difficulty: 3, copy: "さいごの ながい なまえまで つなげよう" },
      ],
      animals: [
        {
          id: "elephant", name: "ぞう", playable: true, order: 1, tablet: 1,
          fact: "ぞうの はなには ほねがなく、おおきな きも ちいさな わらも つかめるよ。",
          quote: "ながい はなは、ちからもちで きような てなんだ！",
        },
        {
          id: "giraffe", name: "きりん", playable: true, order: 2, tablet: 1,
          fact: "きりんの したは 45せんちほどもあり、とげを よけながら きのはを つかめるよ。",
          quote: "たかい ところの おいしい はっぱ、みつけたよ！",
        },
        {
          id: "lion", name: "らいおん", playable: true, order: 5, tablet: 2,
          fact: "らいおんの ほえる こえは、およそ5きろ はなれた ところまで とどくことがあるよ。",
          quote: "がおー！ ぼくの こえ、どこまで とどいたかな？",
        },
        {
          id: "tiger", name: "とら", playable: true, order: 3, tablet: 1,
          fact: "とらの しまもようは 1とうずつ ちがい、しゃしんから みわけることも できるよ。",
          quote: "ぼくだけの しまもよう、よく みてね。",
        },
        {
          id: "panda", name: "ぱんだ", playable: true, discoverable: true, order: 15, tablet: 5,
          fact: "ぱんだの まえあしには、たけを つかむ『おやゆび』のような ほねが あるよ。",
          quote: "たけを じょうずに つかんで、むしゃむしゃ たべるよ！",
        },
        {
          id: "gorilla", name: "ごりら", playable: true, order: 16, tablet: 5,
          fact: "ごりらは えだや はを あつめて、ひるねや よるの ねむりに つかう すを つくるよ。",
          quote: "きょうの ふかふかベッドも、じぶんで つくったよ。",
        },
        {
          id: "zebra", name: "うま", aliases: ["しまうま"], playable: true, order: 6, tablet: 2,
          fact: "この うまは しまうま。しまうまの しまもようは 1とうずつ ちがい、こどもは もようで おかあさんを おぼえるよ。",
          quote: "ぼくは しまうま。しろと くろの しまもようが じまんだよ！",
        },
        {
          id: "rhinoceros", name: "さい", playable: true, order: 4, tablet: 1,
          fact: "さいの つのは、ひとの つめや かみと おなじ ケラチンという ものから できているよ。",
          quote: "かたそうな つのだけど、ほねでは ないんだよ。",
        },
        {
          id: "hippo", name: "かば", playable: true, order: 7, tablet: 2,
          fact: "かばの はだから でる あかっぽい ねんえきは、ひやけを ふせぎ はだを まもるよ。",
          quote: "みずの そとでも、はだを まもる くふうが あるんだ。",
        },
        {
          id: "koala", name: "こあら", playable: true, order: 8, tablet: 3,
          fact: "こあらが たべる ユーカリの はは えいようが すくないので、ながく ねむって ちからを たくわえるよ。",
          quote: "たっぷり ねむって、ゆっくり げんきに なるよ。",
        },
        {
          id: "kangaroo", name: "かんがるー", playable: true, order: 9, tablet: 3,
          fact: "かんがるーの なかまには、うまれたとき 1ぐらむより かるく、じぶんで おかあさんの ふくろへ のぼるものが いるよ。",
          quote: "ちいさく うまれて、ふくろの なかで おおきく なるよ。",
        },
        {
          id: "sheep", name: "ひつじ", playable: true, order: 11, tablet: 4,
          fact: "ひつじの いには 4つの へやがあり、かたい くさを しょうかするのを たすけるよ。",
          quote: "くさを ゆっくり かんで、だいじに たべるよ。",
        },
        {
          id: "goat", name: "やぎ", playable: true, order: 12, tablet: 4,
          fact: "やぎの なかには、きの えだまで のぼって みを たべるものも いるよ。",
          quote: "たかい ところにも、おいしいものを さがしに いくよ！",
        },
        {
          id: "cow", name: "うし", playable: true, order: 13, tablet: 4,
          fact: "うしは いちど のみこんだ くさを くちに もどし、もういちど よく かむよ。",
          quote: "あわてず もういちど、よく かんで たべるんだ。",
        },
        {
          id: "pig", name: "ぶた", playable: true, order: 14, tablet: 4,
          fact: "ぶたは はなが よく、つちの した 25せんちほどに ある たべものも みつけられるよ。",
          quote: "くんくん。この つちの したに おいしいものが あるよ！",
        },
        {
          id: "monkey", name: "さる", playable: true, order: 10, tablet: 3,
          fact: "さるの なかまには、ながい しっぽで きの うえの バランスを とるものが いるよ。",
          quote: "しっぽも つかって、えだから えだへ すすむよ。",
        },
        {
          id: "platypus", name: "かものはし", playable: true, order: 17, tablet: 5,
          fact: "かものはしは みずの なかで め・みみ・はなの あなを とじ、くちばしで えものの でんきの しんごうを かんじるよ。",
          quote: "みえなくても、くちばしで えものを みつけられるよ。",
        },
      ],
    },
    {
      id: "sky",
      title: "そらのなかま",
      scene: "assets/scenes/area-sky-animals-v1.webp",
      icon: "🪶",
      description: "そらや ちじょうで くらす とりたちの なかま",
      available: true,
      tablets: [
        { number: 1, title: "そらのせきばん１", ids: ["sparrow", "pigeon", "crow"], difficulty: 1, copy: "ちかくに いる とりたちを さがそう" },
        { number: 2, title: "そらのせきばん２", ids: ["chicken", "duck", "goose"], difficulty: 2, copy: "にわや みずべの なかまを みつけよう" },
        { number: 3, title: "そらのせきばん３", ids: ["swallow", "swan", "parrot"], difficulty: 3, copy: "ながい なまえも つばさを おって つなげよう" },
        { number: 4, title: "そらのせきばん４", ids: ["budgerigar", "penguin", "owl"], difficulty: 3, copy: "いろいろな くらしかたの とりを さがそう" },
        { number: 5, title: "そらのせきばん５", ids: ["eagle", "hawk", "peacock", "ostrich"], difficulty: 3, copy: "さいごの とりたちまで すべて みつけよう" },
      ],
      animals: [
        {
          id: "sparrow", name: "すずめ", playable: true, order: 1, tablet: 1,
          fact: "すずめは みずだけでなく、つちや すなの うえでも はねを ふるわせて からだを あらうよ。",
          quote: "ぱたぱた。すなのおふろも きもちいいよ！",
        },
        {
          id: "pigeon", name: "はと", playable: true, order: 2, tablet: 1,
          fact: "はとの おやは、のどの ちかくで つくる『そのうみるく』を ひなに あたえるよ。",
          quote: "おとうさんも おかあさんも、ひなの ごはんを つくれるよ。",
        },
        {
          id: "crow", name: "からす", playable: true, order: 3, tablet: 1,
          fact: "からすは ひとの かおを みわけ、じぶんに したことを ながく おぼえているよ。",
          quote: "きみの かお、ちゃんと おぼえたよ！",
        },
        {
          id: "chicken", name: "にわとり", playable: true, order: 4, tablet: 2,
          fact: "にわとりの ひなは、うまれたときから わたげに つつまれ、すぐに あるいて ごはんを さがせるよ。",
          quote: "ぴよぴよ。もう じぶんで あるけるよ！",
        },
        {
          id: "duck", name: "あひる", playable: true, order: 5, tablet: 2,
          fact: "あひるの ふわふわの したばねは くうきを ためて、みずに うかびやすくしてくれるよ。",
          quote: "ふわふわの はねで、ぷかぷか うかぶよ。",
        },
        {
          id: "goose", name: "がちょう", playable: true, order: 6, tablet: 2,
          fact: "がちょうの なかまは Vの かたちに ならび、せんとうを こうたいしながら とぶよ。",
          quote: "つぎは ぼくが せんとうを とぶね！",
        },
        {
          id: "swallow", name: "つばめ", playable: true, order: 7, tablet: 3,
          fact: "つばめは すばやく とびながら、そらを とぶ むしを つかまえて たべるよ。",
          quote: "ひゅーん！ そらの むしを みつけたよ。",
        },
        {
          id: "swan", name: "はくちょう", playable: true, order: 8, tablet: 3,
          fact: "はくちょうの なかまには、2まん5000まいより おおくの はねを もつものが いるよ。",
          quote: "たくさんの はねが、からだを ふんわり つつむよ。",
        },
        {
          id: "parrot", name: "おうむ", playable: true, order: 9, tablet: 3,
          fact: "おうむにも みぎききや ひだりききの ように、よく つかう あしが あるよ。",
          quote: "この あしで もつのが とくいなんだ。",
        },
        {
          id: "budgerigar", name: "いんこ", playable: true, order: 10, tablet: 4,
          fact: "やせいの いんこは みずの ちかくを たびし、ときには とても おおきな むれになるよ。",
          quote: "なかまと いっしょなら、そらが にぎやかだよ！",
        },
        {
          id: "penguin", name: "ぺんぎん", playable: true, order: 11, tablet: 4,
          fact: "ぺんぎんの みっしり はえた はねは みずを はじき、つめたい うみでも からだを まもるよ。",
          quote: "そらは とべないけど、うみの なかなら すいすい！",
        },
        {
          id: "owl", name: "ふくろう", playable: true, order: 12, tablet: 4,
          fact: "ふくろうは めを うごかしにくい かわりに、くびを およそ270ど まわせるよ。",
          quote: "からだは そのままでも、うしろまで みえるよ。",
        },
        {
          id: "eagle", name: "わし", playable: true, order: 13, tablet: 5,
          fact: "わしの なかまは ひとの 4ばいから7ばいほど よく みえ、とおくの えものを みつけられるよ。",
          quote: "たかい そらからでも、よく みえるよ。",
        },
        {
          id: "hawk", name: "たか", playable: true, order: 14, tablet: 5,
          fact: "たかの なかまは あたたかい じょうしょうきりゅうに のり、はばたかずに たかく あがれるよ。",
          quote: "のぼる かぜを つかまえて、ぐんぐん あがるよ！",
        },
        {
          id: "peacock", name: "くじゃく", playable: true, order: 15, tablet: 5,
          fact: "おすの くじゃくが ひろげる おおきな かざりは、ほんとうの おばねより てまえに ある ながい はねだよ。",
          quote: "みてみて！ めだまもようを ぜんぶ ひろげるよ。",
        },
        {
          id: "ostrich", name: "だちょう", playable: true, order: 16, tablet: 5,
          fact: "だちょうは いま いきている いちばん おおきな とりで、あしの ゆびは 2ほんだけだよ。",
          quote: "そらは とべなくても、ながい あしで はしれるよ！",
        },
      ],
    },
    {
      id: "water",
      title: "うみ・かわのなかま",
      scene: "assets/scenes/area-water-animals-v1.webp",
      icon: "🌊",
      description: "みずの なかで くらす なかま",
      available: true,
      tablets: [
        { number: 1, title: "うみかわのせきばん１", ids: ["tuna", "eel", "shark"], difficulty: 1, copy: "みずの なかを すすむ さかなを さがそう" },
        { number: 2, title: "うみかわのせきばん２", ids: ["octopus", "squid", "jellyfish"], difficulty: 2, copy: "やわらかい からだの なかまを みつけよう" },
        { number: 3, title: "うみかわのせきばん３", ids: ["shrimp", "crab", "starfish"], difficulty: 3, copy: "うみの そこに くらす なかまを さがそう" },
        { number: 4, title: "うみかわのせきばん４", ids: ["spotted_garden_eel", "seahorse", "sunfish"], difficulty: 3, copy: "ふしぎな かたちの なまえを つなげよう" },
        { number: 5, title: "うみかわのせきばん５", ids: ["dolphin", "whale", "orca"], difficulty: 3, copy: "おおきな うみを およぐ なかまを みつけよう" },
      ],
      animals: [
        {
          id: "tuna", name: "まぐろ", playable: true, order: 1, tablet: 1,
          fact: "まぐろの からだは、ながい きょりを はやく およぎつづけるのに ぴったりな かたちを しているよ。",
          quote: "とまらず すいすい。うみは とっても ひろいぞ！",
        },
        {
          id: "eel", name: "うなぎ", playable: true, order: 2, tablet: 1,
          fact: "うなぎの なかまには、かわで そだってから たまごを うむために うみへ もどるものが いるよ。",
          quote: "かわから うみまで、ながい たびを してきたよ。",
        },
        {
          id: "shark", name: "さめ", playable: true, order: 3, tablet: 1,
          fact: "さめの なかまは 500しゅるい いじょう。てのひらサイズから とても おおきな さめまで いるよ。",
          quote: "こわそうに みえても、ぼくたちの すがたは いろいろ！",
        },
        {
          id: "octopus", name: "たこ", playable: true, order: 4, tablet: 2,
          fact: "たこには しんぞうが 3つあるよ。8ほんの うでに ならぶ きゅうばんで、まわりを たしかめるんだ。",
          quote: "この きゅうばん、さわるだけで いろいろ わかるよ！",
        },
        {
          id: "squid", name: "いか", playable: true, order: 5, tablet: 2,
          fact: "いかには 8ほんの うでと、えものを つかまえる 2ほんの ながい しょくしゅが あるよ。",
          quote: "ながい 2ほんを しゅっと のばして、つかまえるぞ。",
        },
        {
          id: "jellyfish", name: "くらげ", playable: true, order: 6, tablet: 2,
          fact: "くらげの からだは 95パーセント いじょうが みず。ほねも のうも ない ふしぎな からだだよ。",
          quote: "ぷかぷか、ゆらゆら。うみの ながれに のってきたよ。",
        },
        {
          id: "shrimp", name: "えび", playable: true, order: 7, tablet: 3,
          fact: "えびは からだの そとに かたい からを もつよ。おおきくなるときは ふるい からを ぬぐんだ。",
          quote: "からを ぬいだら、ちょっぴり おおきく なったよ！",
        },
        {
          id: "crab", name: "かに", playable: true, order: 8, tablet: 3,
          fact: "かには かたい こうらを ぬいで おおきくなるよ。なくした あしが、なんどかの だっぴで のびることも あるんだ。",
          quote: "よこあるきなら、ぼくに まかせて！",
        },
        {
          id: "starfish", name: "ひとで", playable: true, order: 9, tablet: 3,
          fact: "ひとでは うでの うらに ならぶ ちいさな くだあしを つかい、みずの ちからで うみの そこを すすむよ。",
          quote: "ちいさな あしが いっぱい。ゆっくりでも すすんでるよ。",
        },
        {
          id: "spotted_garden_eel", name: "ちんあなご", aliases: ["あなご"], playable: true, order: 10, tablet: 4,
          fact: "ちんあなごは しっぽから すなに あなを ほるよ。ながれてくる ちいさな えさを みんなで まっているんだ。",
          quote: "びっくりしたら、しっぽから すなへ かくれるよ！",
        },
        {
          id: "seahorse", name: "たつのおとしご", playable: true, order: 11, tablet: 4,
          fact: "たつのおとしごは、おすの おなかの ふくろで たまごを そだてて、あかちゃんを うむよ。",
          quote: "ぼくの おなかで、あかちゃんを だいじに そだてるよ。",
        },
        {
          id: "sunfish", name: "まんぼう", playable: true, order: 12, tablet: 4,
          fact: "まんぼうは よこから ぎゅっと おされたような ひらたい からだ。ちいさな くちと おおきな めも とくちょうだよ。",
          quote: "この まあるくて ひらたい すがた、わすれないでね。",
        },
        {
          id: "dolphin", name: "いるか", playable: true, order: 13, tablet: 5,
          fact: "いるかは さかなではなく ほにゅうるい。あたまの うえの あなから、くうきを すって いきをするよ。",
          quote: "みずの うえへ いきを すいに、すいっと あがるよ！",
        },
        {
          id: "whale", name: "くじら", playable: true, order: 14, tablet: 5,
          fact: "くじらの なかまの シロナガスクジラは、いままで しられている どうぶつの なかで いちばん おおきいよ。",
          quote: "おおきな うみで、おおきく しおを ふくよ！",
        },
        {
          id: "orca", name: "しゃち", playable: true, order: 15, tablet: 5,
          fact: "しゃちは いるかの なかまで いちばん おおきいよ。むれの なかまと こえを つかって れんらくするんだ。",
          quote: "しろと くろの もようを みつけたら、ぼくだよ！",
        },
      ],
    },
    {
      id: "small_creatures",
      title: "ちいさななかま",
      scene: "assets/scenes/area-small-creatures-animals-v1.webp",
      icon: "🐞",
      description: "あしもとや きの そばの ちいさな なかま",
      available: true,
      tablets: [
        { number: 1, title: "ちいさなせきばん１", ids: ["rhinoceros_beetle", "stag_beetle"], difficulty: 1, copy: "りっぱな つのや あごを もつ なかまを さがそう" },
        { number: 2, title: "ちいさなせきばん２", ids: ["butterfly", "dragonfly", "cicada"], difficulty: 2, copy: "はねで そらを とぶ ちいさな なかまを みつけよう" },
        { number: 3, title: "ちいさなせきばん３", ids: ["ant", "bee", "silkworm"], difficulty: 2, copy: "ちいさな からだで はたらく なかまを つなげよう" },
        { number: 4, title: "ちいさなせきばん４", ids: ["ladybug", "mantis", "grasshopper"], difficulty: 3, copy: "くさむらで くらす めいじんたちを さがそう" },
        { number: 5, title: "ちいさなせきばん５", ids: ["pill_bug", "snail"], difficulty: 3, copy: "じめんの ちかくを すすむ なかまを みつけよう" },
      ],
      animals: [
        {
          id: "rhinoceros_beetle", name: "かぶとむし", playable: true, order: 1, tablet: 1,
          fact: "おすの かぶとむしは おおきな つのを つかい、じゅえきの ばしょや めすを めぐって ほかの おすと たたかうよ。",
          quote: "この つので、あいてを ぐいっと もちあげるぞ！",
        },
        {
          id: "stag_beetle", name: "くわがた", playable: true, order: 2, tablet: 1,
          fact: "くわがたの おすは おおきな あごを つかって、ほかの おすと ちからくらべを するよ。ようちゅうは くちきの なかで そだつんだ。",
          quote: "じまんの おおあご、りっぱでしょ！",
        },
        {
          id: "butterfly", name: "ちょう", playable: true, order: 3, tablet: 2,
          fact: "ちょうの あしには あじを かんじる しくみが あるよ。はっぱに とまって、たまごを うむのに よい ばしょか たしかめるんだ。",
          quote: "あしで ちょん。ここの はっぱは どんな あじ？",
        },
        {
          id: "dragonfly", name: "とんぼ", playable: true, order: 4, tablet: 2,
          fact: "とんぼは たまごから かえったあと、やごとして みずの なかで くらすよ。おおきくなると はねを ひろげて そらへ とびたつんだ。",
          quote: "みずの なかから そらの うえへ。ぼくは どちらも しってるよ！",
        },
        {
          id: "cicada", name: "せみ", playable: true, order: 5, tablet: 2,
          fact: "おすの せみは、おなかの よこにある まくを すばやく うごかして おおきな こえを だすよ。",
          quote: "おなかの まくを ふるわせて、げんきに うたうよ！",
        },
        {
          id: "ant", name: "あり", playable: true, order: 6, tablet: 3,
          fact: "ありは えさを みつけると、においの しるしを のこして すへ もどるよ。なかまは その においの みちを たどるんだ。",
          quote: "においの みちを ついてきて。えさは こっちだよ！",
        },
        {
          id: "bee", name: "はち", playable: true, order: 7, tablet: 3,
          fact: "みつばちは おどりを つかって、はなが ある ほうこうや きょりを すの なかまたちに つたえるよ。",
          quote: "くるくる、ぶんぶん。この さきに はなが あるよ！",
        },
        {
          id: "silkworm", name: "かいこ", playable: true, order: 8, tablet: 3,
          fact: "かいこは くちもとの いとを だす ところから ながい いとを はき、じぶんの まわりに まゆを つくるよ。",
          quote: "ほそい いとを くるくる。まゆが できてきたよ。",
        },
        {
          id: "ladybug", name: "てんとうむし", playable: true, order: 9, tablet: 4,
          fact: "てんとうむしの なかまには、おとなも ようちゅうも あぶらむしを たくさん たべる しゅるいが いるよ。",
          quote: "はっぱを まもる ちいさな パトロールたいだよ！",
        },
        {
          id: "mantis", name: "かまきり", playable: true, order: 10, tablet: 4,
          fact: "かまきりは するどい とげの ならんだ まえあしで、ちかづいた えものを すばやく つかまえるよ。",
          quote: "まえあしを かまえて、じっと まっているんだ。",
        },
        {
          id: "grasshopper", name: "ばった", playable: true, order: 11, tablet: 4,
          fact: "ばったの みみは あたまではなく、おなかの はじめの ほうに あるよ。おおきな うしろあしは ジャンプの めいしゅだ。",
          quote: "おとを よくきいて、つぎは どこまで とぼうかな！",
        },
        {
          id: "pill_bug", name: "だんごむし", playable: true, order: 12, tablet: 5,
          fact: "だんごむしは むしの なかまではなく、えびや かにに ちかい こうかくるい。7ついの あしで じめんを あるくよ。",
          quote: "びっくりしたら、からだを まるくして だんごに なるよ！",
        },
        {
          id: "snail", name: "かたつむり", playable: true, order: 13, tablet: 5,
          fact: "かたつむりは しぜつと よばれる ちいさな はの ならんだ したを つかい、たべものを けずりとって たべるよ。",
          quote: "ざらざらの したで、はっぱを ゆっくり いただきます。",
        },
      ],
    },
    {
      id: "reptiles_amphibians",
      title: "みずべのなかま",
      scene: "assets/scenes/area-waterside-animals-v1.webp",
      icon: "🐢",
      description: "みずべや あたたかい ばしょの なかま",
      available: true,
      tablets: [
        { number: 1, title: "みずべのせきばん１", ids: ["frog", "tadpole"], difficulty: 1, copy: "みずべで すがたを かえる なかまを さがそう" },
        { number: 2, title: "みずべのせきばん２", ids: ["newt", "gecko"], difficulty: 2, copy: "みずべや いえの ちかくに いる なかまを みつけよう" },
        { number: 3, title: "みずべのせきばん３", ids: ["lizard", "snake"], difficulty: 2, copy: "ながい からだや しっぽの なかまを つなげよう" },
        { number: 4, title: "みずべのせきばん４", ids: ["turtle"], difficulty: 3, copy: "かたい こうらを もつ なかまを さがそう" },
        { number: 5, title: "みずべのせきばん５", ids: ["crocodile"], difficulty: 3, copy: "みずに かくれる おおきな なかまを みつけよう" },
      ],
      animals: [
        {
          id: "frog", name: "かえる", playable: true, order: 1, tablet: 1,
          fact: "かえるの なかまは ひふでも いきを するよ。おなかから みずを すいこむ なかまも いるんだ。",
          quote: "ひふも おなかも、みずと なかよしなんだよ。",
        },
        {
          id: "tadpole", name: "おたまじゃくし", playable: true, order: 2, tablet: 1,
          fact: "おたまじゃくしは へんたいして あしが はえ、しっぽが みじかくなって かえるの すがたへ かわるよ。",
          quote: "いまは しっぽで すいすい。いつかは ぴょん！",
        },
        {
          id: "newt", name: "いもり", playable: true, order: 3, tablet: 2,
          fact: "いもりの なかまは、けがで なくした あしや しっぽなどを もういちど そだてられるよ。",
          quote: "なくした ところも、ゆっくり なおしてみせるよ。",
        },
        {
          id: "gecko", name: "やもり", playable: true, order: 4, tablet: 2,
          fact: "やもりの なかまの ゆびさきには、とても ほそい けが たくさん あるよ。その ちからで かべや てんじょうに くっつくんだ。",
          quote: "この ゆびさきなら、かべも てんじょうも へっちゃら！",
        },
        {
          id: "lizard", name: "とかげ", playable: true, order: 5, tablet: 3,
          fact: "とかげの なかまには、おそわれると しっぽを きりはなし、うごく しっぽに きを とらせて にげるものが いるよ。",
          quote: "しっぽに びっくりした？ ぼくは もう にげたあと！",
        },
        {
          id: "snake", name: "へび", playable: true, order: 6, tablet: 3,
          fact: "へびは ふたまたの したで においの つぶを あつめ、くちの てんじょうにある とくべつな きかんで しらべるよ。",
          quote: "ぺろぺろ。くうきの においを しらべてるんだ。",
        },
        {
          id: "turtle", name: "かめ", playable: true, order: 7, tablet: 4,
          fact: "かめの こうらは からだに のせた よろいではなく、せぼねや あばらぼねと つながった ほねの いちぶだよ。",
          quote: "この こうら、ぼくの ほねと つながっているんだよ。",
        },
        {
          id: "crocodile", name: "わに", playable: true, order: 8, tablet: 5,
          fact: "わには めと みみと はなが あたまの うえの ほうに ならび、からだの ほとんどを みずに しずめても まわりを たしかめられるよ。",
          quote: "めと みみと はなだけ みずの うえ。こっそり みているよ。",
        },
      ],
    },
    {
      id: "ancient",
      title: "たいこのなかま",
      scene: "assets/scenes/area-ancient-animals-v1.webp",
      icon: "🦴",
      description: "おおむかしの ちきゅうに いた なかま",
      available: true,
      tablets: [
        { number: 1, title: "たいこのせきばん１", ids: ["mammoth", "dodo"], difficulty: 1, copy: "おおむかしに きえた ふしぎな なかまを さがそう" },
        { number: 2, title: "たいこのせきばん２", ids: ["sabertooth"], difficulty: 2, copy: "ながい きばを もつ たいこの ねこの なかまを みつけよう" },
        { number: 3, title: "たいこのせきばん３", ids: ["tyrannosaurus", "triceratops"], difficulty: 3, copy: "おおきな あごと さんぼんの つのを もじから よみがえらせよう" },
        { number: 4, title: "たいこのせきばん４", ids: ["pteranodon"], difficulty: 3, copy: "うみの うえを とんだ はちゅうるいの なかまを さがそう" },
        { number: 5, title: "たいこのせきばん５", ids: ["stegosaurus"], difficulty: 3, copy: "せなかに おおきな いたが ならぶ なかまを みつけよう" },
      ],
      animals: [
        {
          id: "mammoth", name: "まんもす", playable: true, order: 1, tablet: 1,
          fact: "けぶかい まんもすは、あつい けと しぼうで さむさから からだを まもったよ。おおきく まがった きばで きの かわを はがしたり、じめんを ほったりしたんだ。",
          quote: "ふさふさの けがあれば、こおりの だいちも へっちゃら！",
        },
        {
          id: "dodo", name: "どーどー", playable: true, order: 2, tablet: 1,
          fact: "どーどーは もーりしゃすとうに いた、とべない はとの なかま。しまで くらすうちに からだが おおきくなり、そらを とばなくなったよ。",
          quote: "そらは とばないけれど、じめんを げんきに あるくよ。",
        },
        {
          id: "sabertooth", name: "さーべるたいがー", playable: true, order: 3, tablet: 2,
          fact: "さーべるたいがーと よばれる すみろどんは、ほんとうは とらではなく ねこの なかま。ながい きばと ちからづよい まえあしを もっていたよ。",
          quote: "ながい きばだけじゃない。まえあしも じまんなんだ！",
        },
        {
          id: "tyrannosaurus", name: "てぃらのさうるす", playable: true, order: 4, tablet: 3,
          fact: "てぃらのさうるすは 60ぽんほどの おおきな はと つよい あごで、ほねまで かみくだけたと かんがえられているよ。",
          quote: "おおきな あごで、がぶり！ でも まえあしは ちいさいよ。",
        },
        {
          id: "triceratops", name: "とりけらとぷす", playable: true, order: 5, tablet: 3,
          fact: "とりけらとぷすは さんぼんの つのと おおきな えりかざりを もつ そうしょくきょうりゅう。くちばしで かたい しょくぶつを きったよ。",
          quote: "さんぼんの つのと おおきな えりかざり、りっぱでしょ！",
        },
        {
          id: "pteranodon", name: "ぷてらのどん", playable: true, order: 6, tablet: 4,
          fact: "ぷてらのどんは きょうりゅうではなく、そらを とんだ はちゅうるいの なかま。はの ない ながい くちばしを もち、さかなを たべていたと かんがえられているよ。",
          quote: "きょうりゅうじゃないよ。おおきな はねで うみの うえを すいーっ！",
        },
        {
          id: "stegosaurus", name: "すてごさうるす", playable: true, order: 7, tablet: 5,
          fact: "すてごさうるすの せなかには おおきな いたが ならび、しっぽの さきには よんほんの とげが あったよ。",
          quote: "せなかは いた、しっぽは とげ。うしろにも きを つけてね！",
        },
      ],
    },
    {
      id: "legendary",
      title: "でんせつのなかま",
      scene: "assets/scenes/area-legendary-animals-v1.webp",
      icon: "✦",
      description: "ものがたりに のこる ふしぎな なかま",
      available: true,
      tablets: [
        { number: 1, title: "でんせつのせきばん１", ids: ["unicorn", "pegasus"], difficulty: 1, copy: "いっぽんの つのと しろい つばさを もじから よみがえらせよう" },
        { number: 2, title: "でんせつのせきばん２", ids: ["dragon"], difficulty: 2, copy: "つばさと うろこを もつ でんせつの りゅうを みつけよう" },
        { number: 3, title: "でんせつのせきばん３", ids: ["phoenix"], difficulty: 2, copy: "あかく かがやく でんせつの とりを もじから さがそう" },
        { number: 4, title: "でんせつのせきばん４", ids: ["griffin", "mermaid"], difficulty: 3, copy: "そらと うみの ものがたりに のこる なかまを みつけよう" },
        { number: 5, title: "でんせつのせきばん５", ids: ["tsuchinoko"], difficulty: 3, copy: "ころんと ふとい にほんの まぼろしの へびを さがそう" },
      ],
      animals: [
        {
          id: "unicorn", name: "ゆにこーん", playable: true, order: 1, tablet: 1,
          fact: "ちゅうせいヨーロッパの ものがたりでは、ゆにこーんの つのには どくの はいった みずを きれいにする ちからが あると しんじられていたよ。",
          quote: "いっぽんの つので、きれいな みずを まもるよ！",
        },
        {
          id: "pegasus", name: "ぺがさす", playable: true, order: 2, tablet: 1,
          fact: "ぺがさすは ギリシャしんわに とうじょうする つばさを もつ うま。えいゆう ベレロポンを せに のせ、かいぶつ キマイラと たたかったと かたられているよ。",
          quote: "しろい つばさで、くもより たかく とべるんだ！",
        },
        {
          id: "dragon", name: "どらごん", playable: true, order: 3, tablet: 2,
          fact: "どらごんの すがたは くにや じだいで さまざま。ヨーロッパの ものがたりでは、つばさと うろこと つめを もち、ひを はく ものも いるよ。",
          quote: "つばさを ひろげて、ほのおを ふーっ！",
        },
        {
          id: "phoenix", name: "ふぇにっくす", playable: true, order: 4, tablet: 3,
          fact: "ふぇにっくすは ふるい ものがたりの ふしぎな とり。ながく いき、さいごに もえたあと、はいの なかから もういちど うまれると かたられたよ。",
          quote: "はいの なかから、もういちど はばたくよ！",
        },
        {
          id: "griffin", name: "ぐりふぉん", playable: true, order: 5, tablet: 4,
          fact: "ぐりふぉんは わしの あたまと つばさ、らいおんの からだを もつ でんせつの いきもの。そらと だいちの つよい どうぶつが ひとつに なった すがただよ。",
          quote: "わしの つばさと、らいおんの ちからを みて！",
        },
        {
          id: "mermaid", name: "にんぎょ", playable: true, order: 6, tablet: 4,
          fact: "にんぎょは じょうはんしんが ひと、かはんしんが さかなの しっぽと かたられる うみの いきもの。せかいの いろいろな ばしょに、にんぎょの ものがたりが あるよ。",
          quote: "うみの ものがたりを、たくさん しっているよ。",
        },
        {
          id: "tsuchinoko", name: "つちのこ", playable: true, order: 7, tablet: 5,
          fact: "つちのこは にほんに つたわる、どうが ふっくら ふとい へびのような いきもの。むかしは ようかい、のちには まぼろしの へびとして わだいに なったよ。",
          quote: "みつけられるかな？ ころんと かくれているよ。",
        },
      ],
    },
  ];
})();
