import {
  supportedLangs,
  codes,
  notification,
  getCode,
  $msg,
  initLang,
  tmpMessage,
  getCodeN,
  notifyMsg,
} from './code.map';

xdescribe('Code Map Util', () => {
  it('Should return key using key getCode(KEY)', () => {
    const key1 = getCode('G_01');
    const key2 = getCode('M_A1');
    const key3 = getCode('M_OK');
    const key4 = getCode('M_UU1');

    expect(key1).toBe('G_01');
    expect(key2).toBe('M_A1');
    expect(key3).toBe('M_OK');
    expect(key4).toBe('M_UU1');
  });

  it('Should return key using key getCodeN(KEY)', () => {
    const key1 = getCodeN('GAME_START');
    const key2 = getCodeN('GAME_CANCELLED');
    const key3 = getCodeN('GAME_START_IN_2_MIN');
    const key4 = getCodeN('GAME_START_IN_5_MIN');
    const key5 = getCodeN('GAME_START_IN_30_MIN');

    expect(key1).toBe('GAME_START');
    expect(key2).toBe('GAME_CANCELLED');
    expect(key3).toBe('GAME_START_IN_2_MIN');
    expect(key4).toBe('GAME_START_IN_5_MIN');
    expect(key5).toBe('GAME_START_IN_30_MIN');
  });

  it('Should return message in English for the given keys and lang en', () => {
    const lang: supportedLangs = supportedLangs.en;

    const key1 = $msg('G_01', lang);
    const key2 = $msg('M_A1', lang);
    const key3 = $msg('M_OK', lang);
    const key4 = $msg('M_UU1', lang);

    expect(key1).toBe(codes.G_01.en);
    expect(key2).toBe(codes.M_A1.en);
    expect(key3).toBe(codes.M_OK.en);
    expect(key4).toBe(codes.M_UU1.en);
  });

  it('Should return message in Turkyis for the given keys and lang tr', () => {
    const lang: supportedLangs = supportedLangs.tr;

    const key1 = $msg('G_01', lang);
    const key2 = $msg('M_A1', lang);
    const key3 = $msg('M_OK', lang);
    const key4 = $msg('M_UU1', lang);

    expect(key1).toBe(codes.G_01.tr);
    expect(key2).toBe(codes.M_A1.tr);
    expect(key3).toBe(codes.M_OK.tr);
    expect(key4).toBe(codes.M_UU1.tr);
  });

  it('Should return message in English for a undined key', () => {
    const lang = undefined;
    const key1 = $msg('G_01', lang);
    const key2 = $msg('M_A1', lang);
    const key3 = $msg('M_OK', lang);
    const key4 = $msg('M_UU1', lang);

    expect(key1).toBe(codes.G_01.en);
    expect(key2).toBe(codes.M_A1.en);
    expect(key3).toBe(codes.M_OK.en);
    expect(key4).toBe(codes.M_UU1.en);
  });

  it('Should return en from any', () => {
    const cases = ['hel', undefined, null, 0, 'en'];

    cases.forEach(item => {
      expect(initLang(item)).toBe(supportedLangs.en);
    });
  });

  it('Should return tr from tr', () => {
    const cases = ['tr'];

    cases.forEach(item => {
      expect(initLang(item)).toBe(supportedLangs.tr);
    });
  });

  it('Should return the correct format', () => {
    const cases = {
      otp: 123456,
    };
    expect(tmpMessage('OTP', cases, supportedLangs.en)).toBe(
      '123456 is your KnoWin verification code',
    );

    const cases2 = {
      otp: 345678,
    };
    expect(tmpMessage('OTP', cases2, supportedLangs.tr)).toBe(
      '345678 doğrulama kodu ile KnoWin uygulamasına giriş yapabilirsiniz.',
    );
  });

  it('Should return the correct message', () => {
    expect(notifyMsg('GAME_CANCELLED', supportedLangs.en)).toStrictEqual({
      title: notification['GAME_CANCELLED'].TITLE.en,
      body: notification['GAME_CANCELLED'].BODY.en,
    });
  });
});
