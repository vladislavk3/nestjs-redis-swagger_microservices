export enum supportedLangs {
  en = 'en',
  tr = 'tr',
}

export const codes = {
  // Main Service Codes
  M_OK: {
    en: 'OK',
    tr: 'Tamam',
  },
  M_DONE: {
    en: 'Done',
    tr: 'Tamamlandı',
  },
  M_NOT_FOUND: {
    en: 'Not Found',
    tr: 'Bulunamadı',
  },
  M_IE: {
    en: 'Internal Error',
    tr: 'İç hata',
  },
  M_Q_NA: {
    en: 'Not allowed fields in the query',
    tr: 'Sorgudaki izin verilmeyen alanlar',
  },
  M_TRY_AGAIN: {
    en: 'Try Again',
    tr: 'Tekrar Deneyiniz',
  },
  M_LIMIT_EXCEEDED: {
    en: 'You have exceeded you limits',
    tr: 'Kod gönderme sınırını aştınız.',
  },
  M_A1: {
    en: 'Otp Sent',
    tr: 'Otp Gönderildi',
  },
  M_A2: {
    en: 'Phone number not valid',
    tr: 'Telefon numarası geçerli değil',
  },
  M_A3: {
    en: 'Successfully verified user ',
    tr: 'Başarıyla doğrulanan kullanıcı',
  },
  M_A4: {
    en: 'Otp is not valid',
    tr: 'Kod geçerli değil',
  },
  M_P0: {
    en:
      'Package not found, If your balance is already deducted please contact support!',
    tr:
      'Paket bulunamadı, bakiyeniz zaten düşülmüşse lütfen destekle iletişime geçin!',
  },
  M_P1: {
    en: 'Package added to the account!',
    tr: 'Hesaba paket eklendi!',
  },
  M_P2: {
    en: 'Error on update',
    tr: 'Güncelleme hatası',
  },
  M_P3: {
    en: 'Your purchase is already verified and added to your products list.',
    tr: 'Satın alma işleminiz zaten doğrulandı ve ürün listenize eklendi.',
  },
  M_P4: {
    en: 'Could not verify your receipt',
    tr: 'Faturanız doğrulanamadı',
  },
  M_P5: {
    en: 'Not enough coins',
    tr: 'Yeterli puanınız yok',
  },
  M_PP: {
    en: 'Form submitted!',
    tr: 'Form gönderildi!',
  },
  M_Q1: {
    en: 'Question Added!',
    tr: 'Soru Eklendi!',
  },
  M_QQ1: {
    en: 'Image not found!',
    tr: 'Resim bulunamadı!',
  },

  M_QQ2: {
    en: 'Quiz added!',
    tr: 'Yarışma eklendi!',
  },
  M_QQ3: {
    en: 'You have to buy keys to join the quizzes!',
    tr: 'Yarışmalara katılmak için anahtarlar satın almalısınız!',
  },
  M_QQ4: {
    en: 'Quiz not found or has ended or you already joined!',
    tr: 'Yarışma bulunamadı veya sona erdi veya zaten katıldınız!',
  },
  M_QQ5: {
    en: 'Quiz is full',
    tr: 'Yarışma Dolu',
  },
  M_QQ6: {
    en: `You don't have enough points please add some points and try again!`,
    tr: `Yeterli puanınız yok, lütfen puan ekleyin ve tekrar deneyin!`,
  },
  M_QQ7: {
    en: 'You Joined The Quiz.',
    tr: 'Yarışmaya katıldınız.',
  },
  M_QQ8: {
    en: `Quiz is past 30min time limit! You cant't leave the quiz now.`,
    tr: `Quiz is past 30min time limit! You cant't leave the quiz now tr.`,
  },
  M_T1: {
    en: 'Transaction created',
    tr: 'İşlem oluşturuldu.',
  },
  M_T2: {
    en: 'Not a correct value for status',
    tr: 'Doğru değer değil',
  },
  M_T3: {
    en: `Can't update a failed transaction!`,
    tr: `Başarısız bir işlem güncellenemiyor!`,
  },
  M_U1: {
    en: 'Duplicate entry',
    tr: 'Yinelenen giriş',
  },
  M_UU1: {
    en: 'Empty, Nothing to Update.',
    tr: 'Boş, Güncellenecek bir şey yok.',
  },
  M_UU2: {
    en: 'Date should be in format DD/MM/YYYY',
    tr: 'Tarih GG / AA / YYYY biçiminde olmalıdır',
  },
  M_UU3: {
    en: 'Name already taken',
    tr: 'isim zaten alınmış',
  },
  M_UU4: {
    en:
      'Please check the file again it should be less then 5KB and one of the following format jpeg, jpg, png',
    tr:
      'Lütfen dosyayı tekrar kontrol edin 5 KBden az olmalı ve  jpg, jpeg veya png olmalıdır.',
  },
  M_UU5: {
    en: 'Code not found!',
    tr: 'Kod bulunamadı',
  },
  M_UU6: {
    en: 'Referral already redeemed!',
    tr: 'Yönlendirme zaten kullanılmış!',
  },
  M_UU7: {
    en: `Can't use your own code`,
    tr: `Kendi kodunuzu kullanamazsınız`,
  },
  M_UU8: {
    en: `Points successfully added to both referent and referrer.`,
    tr: `Puanlar size ve referansınıza başarıyla eklendi`,
  },
  M_UU9: {
    en: `Email verification link sent, needs to verify email to save`,
    tr: `E-posta doğrulama bağlantısı gönderildi, kaydetmek için e-postayı doğrulaması gerekiyor`,
  },
  M_UU10: {
    en: `Username already exists!`,
    tr: `Kullanıcı adı zaten var`,
  },

  // Game Service codes
  G_01: {
    en: `You lost the game`,
    tr: `Oyunu kaybettin`,
  },
  G_02: {
    en: `Not allowed!`,
    tr: `İzin verilmiyor!`,
  },
  G_03: {
    en: `You are already in a game session so you can't join, leave the other sessions to join on other device!`,
    tr: `Zaten bir oyun oturumundasınız, bu yüzden katılamazsınız, diğer oturumları diğer cihazlara katılmak için bırakın!`,
  },
  G_04: {
    en: `User doesn't have the power up.`,
    tr: `Kullanıcının jokerleri yok`,
  },
  G_05: {
    en: `You can't use this power-up for that`,
    tr: `Bunun için bu jeokeri kullanamazsınız.`,
  },
  G_06: {
    en: `Successfully applied 50-50!`,
    tr: `Başarıyla 50-50 jokeri uygulandı!`,
  },
  G_07: {
    en: `You can't use this for the last question`,
    tr: `Bunu son soru için kullanamazsınız.`,
  },
  G_08: {
    en: `Successfully applied Pass!`,
    tr: `Başarıyla Pas jokeri uygulandı!`,
  },
  G_09: {
    en: `You can't use this you have already answered the question.`,
    tr: `Bunu kullanamazsınız zaten soruyu cevapladınız.`,
  },
  G_10: {
    en: `Try count can only be 1 and 2 not other values are allowed`,
    tr: `Deneme sayısı sadece 1 ve 2 olabilir, başka değerlere izin verilmez.`,
  },
  G_11: {
    en: `Only 2 attempts allowed.`,
    tr: `Form 2'yi aşmaya çalışıldı.`,
  },
  G_12: {
    en: `Your answer was correct!`,
    tr: `Cevabınız doğru!`,
  },
  G_13: {
    en: `Select another answer!`,
    tr: `Başka bir cevap seçin!`,
  },
  G_14: {
    en: `Your answer was correct!`,
    tr: `Cevabınız doğru!`,
  },
  G_15: {
    en: `You used your two options.`,
    tr: `İki seçeneğinizi kullandınız.`,
  },
  G_17: {
    en: `Successfully applied Double Answers! choose two options now.`,
    tr: `Çift cevap hakkı başarıyla uygulandı! şimdi iki seçenek seçin.`,
  },
  G_18: {
    en: `You can't use this for the last question`,
    tr: `Son soru için bunu kullanamazsın`,
  },
  G_19: {
    en: `Successfully applied extra-life!`,
    tr: `Ekstra can hakkı başarıyla uygulandı!`,
  },
  G_20: {
    en: `User id not provided!`,
    tr: `Kullanıcı kimliği sağlanmadı!`,
  },
  G_21: {
    en: `You can't answer now game in wait state!`,
    tr: `Bekleme durumunda şimdi oyuna cevap veremezsiniz!`,
  },
  G_22: {
    en: `You can't answer now because you lost (You can use your power-up if you have)!`,
    tr: `Şimdi cevap veremezsiniz çünkü kaybettiniz (Jokeriniz varsa kullanabilirsiniz)!`,
  },
  G_23: {
    en: `Time done to answer this question!`,
    tr: `Bu soruyu cevaplamak için zaman doldu!`,
  },
  G_24: {
    en: `Your game has ended you can use the heart power-up if you have one!`,
    tr: `Oyununuz bittiğinde kalp gücünüzü kullanabilirsiniz!`,
  },
  G_25: {
    en: `Alredy answered! `,
    tr: `Zaten cevaplandı !`,
  },
  // Notifications and OTPs
  OTP: {
    en: `{otp} is your KnoWin verification code`,
    tr: `{otp} doğrulama kodu ile KnoWin uygulamasına giriş yapabilirsiniz.`,
  },
};

export const notification = {
  GAME_START: {
    TITLE: {
      en: `Game is starting!`,
      tr: `Yarışma başlıyor!`,
    },
    BODY: {
      en: `A quiz you joined will start soon.`,
      tr: `Katılmış olduğunuz yarışma birazdan başlayacak`,
    },
  },
  GAME_START_IN_30_MIN: {
    TITLE: {
      en: `Game is starting!`,
      tr: `Yarışma başlıyor!`,
    },
    BODY: {
      en: `A quiz you joined will start in 30 min.`,
      tr: `Katılmış olduğunuz yarışma 30 dk içinde başlıyor`,
    },
  },
  GAME_START_IN_5_MIN: {
    TITLE: {
      en: `Game is starting!`,
      tr: `Yarışma başlıyor!`,
    },
    BODY: {
      en: `A quiz you joined will start in 5 min.`,
      tr: `Katılmış olduğunuz yarışma 5 dk içinde başlayacak`,
    },
  },
  GAME_START_IN_2_MIN: {
    TITLE: {
      en: `Game is starting!`,
      tr: `Yarışma başlıyor!`,
    },
    BODY: {
      en: `A quiz you joined will start in 2 min.`,
      tr: `Katılmış olduğunuz yarışma 2 dk içinde başlayacak`,
    },
  },
  GAME_CANCELLED: {
    TITLE: {
      en: `Quiz Cancelled {category} !`,
      tr: `Yarışma iptal edildi {category} !`,
    },
    BODY: {
      en: `A quiz you joined had been cancelled, your keys has been refunded to you account.`,
      tr: `Katıldığınız bir yarışma iptal edildi, anahtarlarınız hesabınıza iade edildi.`,
    },
  },

  REFERRAL_RECIVED: {
    TITLE: {
      en: `Points Recived!`,
      tr: `Puanlar Hesabınıza Ulaştı!`,
    },
    BODY: {
      en: `Points from one of your referral has been added to your account!`,
      tr: `Referanslarınızdan birindeki puanlar hesabınıza eklendi!`,
    },
  },

  REFUND_TRANSACTION: {
    TITLE: {
      en: `Refund Deduction!`,
      tr: `Geri Ödeme Kesintisi!`,
    },
    BODY: {
      en: `Due to your recent refund we have may have removed powerups , keys or points from your account according to our rules. Repeat use of refund may block you account!`,
      tr: `Son iade talebiniz nedeniyle, kurallarımıza göre hesabınızdan joker, anahtar veya puanları kaldırmış olabiliriz. Geri ödemenin tekrar kullanımı hesabınızı engelleyebilir!`,
    },
  },
  REFUND_TRANSACTION_BLOCK: {
    TITLE: {
      en: `You was blocked`,
      tr: `Hesabınız engellendi!`,
    },
    BODY: {
      en: `Due to your multiple refunds your account is been suspended!`,
      tr: `Birden fazla geri iade talebinden ötürü hesabınız askıya alındı!`,
    },
  },

  GAME_PRIZE_REDUCED: {
    TITLE: {
      en: `Game prize reduced`,
      tr: `Oyun ödülü azaltıldı!`,
    },
    BODY: {
      en: `Due to less then 50% user in one of the quiz you joined we have reduced the reward to half!`,
      tr: `Katıldığınız yarışmaya % 50 den az katılım sağlandığından ödül yarıya düşmüştür!`,
    },
  },
};

// context => {
//   // any key you want to replace as a object
// }
//ex. To replace otp send content as
// {
//   otp: 1234
// }
export const initLang = (lang?: any): supportedLangs => {
  if (Object.values(supportedLangs).includes(lang)) {
    return lang;
  } else {
    return supportedLangs.en;
  }
};
export const notifyMsg = (
  type: keyof typeof notification,
  lang: supportedLangs,
) => {
  lang = initLang(lang);
  return {
    title: notification[type].TITLE[lang],
    body: notification[type].BODY[lang],
  };
};
export const tmpMessage = (
  code: keyof typeof codes,
  context: any,
  lang: supportedLangs,
) => {
  lang = initLang(lang);
  let targetStr = codes[code][lang];
  Object.keys(context).map(key => {
    const value = context[key];
    const regx = new RegExp(`{${key}}`, 'g');
    targetStr = targetStr.replace(regx, value);
  });

  return targetStr;
};

export const tmpMessageN = (
  code: keyof typeof notification,
  context: any,
  lang: supportedLangs,
) => {
  lang = initLang(lang);
  let title = notification[code].TITLE[lang];
  let body = notification[code].BODY[lang];

  Object.keys(context).map(key => {
    const value = context[key];
    const regx = new RegExp(`{${key}}`, 'g');
    title = title.replace(regx, value);
  });

  return {
    title,
    body,
  };
};

export const getCode = (code: keyof typeof codes) => {
  const key = Object.keys(codes).find(_code => _code === code);
  return key;
};

export const getCodeN = (code: keyof typeof notification) => {
  const key = Object.keys(notification).find(_code => _code === code);
  return key;
};

// return message and error code
export const $msg = (code: keyof typeof codes, lang: supportedLangs) => {
  lang = initLang(lang);
  return codes[code][lang];
};
