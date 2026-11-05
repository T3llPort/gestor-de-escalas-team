/* Acesso à plataforma: usuários, empresas, papéis, senha e sessão.
 *
 * Enquanto não há backend, tudo fica no localStorage deste navegador. A senha é guardada como
 * hash com sal (SHA-256 repetido), mas isso não protege os dados de quem tem acesso ao
 * computador: o controle de acesso de verdade virá com o servidor e o banco de dados.
 */
(function (App) {
  const U = App.util;
  const KEY = 'escalas5x2:plataforma';
  const SESSION_KEY = 'escalas5x2:sessao';
  const SENHA_MIN = 6;
  const ITERACOES = 5000; // cerca de 0,25 s por login

  const PAPEIS = {
    master: {
      label: 'Master',
      desc: 'Acessa todas as telas: cadastra empresas e usuários e ajusta a escala de qualquer empresa, escolhida na barra lateral.'
    },
    gerente: {
      label: 'Gerente',
      desc: 'Monta a escala, cadastra funcionários, escalas de horário, o limite de folgas e os usuários da própria empresa, e vê o histórico de alterações.'
    },
    operador: {
      label: 'Operador',
      desc: 'Consulta e ajusta a escala e cadastra os funcionários da empresa.'
    }
  };

  // Telas que cada papel pode abrir; a primeira é a tela inicial.
  const ROTAS = {
    master: ['escala', 'funcionarios', 'configuracoes', 'historico', 'empresas', 'usuarios'],
    gerente: ['escala', 'funcionarios', 'configuracoes', 'historico', 'usuarios'],
    operador: ['escala', 'funcionarios']
  };

  // ---------- SHA-256 (sem depender de crypto.subtle, que só existe em https/localhost) ----------
  const K = new Uint32Array(64);
  const H0 = new Uint32Array(8);
  (function () {
    const primos = [];
    for (let n = 2; primos.length < 64; n++) {
      if (primos.every((p) => n % p)) primos.push(n);
    }
    const frac = (x) => ((x - Math.floor(x)) * 0x100000000) >>> 0;
    primos.forEach((p, i) => {
      K[i] = frac(Math.cbrt(p));
      if (i < 8) H0[i] = frac(Math.sqrt(p));
    });
  })();

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256(bytes) {
    const len = bytes.length;
    const total = Math.ceil((len + 9) / 64) * 64;
    const msg = new Uint8Array(total);
    msg.set(bytes);
    msg[len] = 0x80;
    const dv = new DataView(msg.buffer);
    dv.setUint32(total - 8, Math.floor(len / 0x20000000));
    dv.setUint32(total - 4, (len * 8) >>> 0);
    const H = H0.slice();
    const W = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const a = W[i - 15], b = W[i - 2];
        const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
        const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    H.forEach((v, i) => odv.setUint32(i * 4, v));
    return out;
  }

  const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const utf8 = (s) => new TextEncoder().encode(s);

  function randomSalt() {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return toHex(b);
  }

  // Hash da senha com sal, repetido para deixar tentativas em massa mais lentas.
  function hashSenha(senha, salt) {
    const saltBytes = utf8(salt);
    let h = sha256(utf8(salt + ':' + senha));
    for (let i = 1; i < ITERACOES; i++) {
      const buf = new Uint8Array(h.length + saltBytes.length);
      buf.set(h);
      buf.set(saltBytes, h.length);
      h = sha256(buf);
    }
    return toHex(h);
  }

  // ---------- Dados da plataforma ----------
  // Acessos fixos da plataforma, até os usuários virem do banco de dados. Só sal e hash da senha
  // ficam no código. `fixo`: não pode ser excluído, inativado nem mudar de papel pela tela.
  const USUARIOS_FIXOS = [
    {
      id: 'master-fourtech', nome: 'Administrador Fourtech', email: 'adm@fourtechsolucoes.com.br',
      papel: 'master', empresaId: null, ativo: true, fixo: true,
      salt: '6311c5ea640de1cd5cef0d32ba9db210',
      senhaHash: 'cb7a85fb5f43685e73fd8860a8d7b806890c381cabdc3fede30792a0bee56c54',
      criadoEm: '2026-10-27T00:00:00.000Z'
    }
  ];

  let data = load();

  function load() {
    let d = null;
    try {
      const raw = localStorage.getItem(KEY);
      d = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Falha ao ler os dados de acesso', e);
    }
    const out = {
      empresas: d && Array.isArray(d.empresas) ? d.empresas : [],
      usuarios: d && Array.isArray(d.usuarios) ? d.usuarios : []
    };
    // Os acessos fixos existem em qualquer navegador; se já estão salvos (ex.: senha trocada), vale o salvo.
    USUARIOS_FIXOS.forEach((f) => {
      if (!out.usuarios.some((u) => u.id === f.id || u.email === f.email)) out.usuarios.push(Object.assign({}, f));
    });
    return out;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.error(e);
      U.toast('Não foi possível salvar os dados de acesso neste navegador.', 'error');
    }
    // Avisa a interface (resumo da barra lateral, nome da empresa) que empresas ou usuários mudaram.
    document.dispatchEvent(new CustomEvent('escalas:dados'));
  }

  function normEmail(email) { return String(email || '').trim().toLowerCase(); }
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(email)); }

  function validarSenha(senha) {
    return String(senha || '').length < SENHA_MIN ? `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.` : null;
  }

  // Sem a senha e o sal, para as telas.
  function publico(u) {
    if (!u) return null;
    const { senhaHash, salt, ...resto } = u;
    return resto;
  }

  // ---------- Empresas ----------
  function empresas() {
    return data.empresas.slice().sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR'));
  }

  function getEmpresa(id) {
    return data.empresas.find((e) => e.id === id) || null;
  }

  function findEmpresaByCNPJ(cnpj) {
    const c = U.onlyDigits(cnpj);
    return data.empresas.find((e) => e.cnpj === c) || null;
  }

  function addEmpresa({ cnpj, razaoSocial, ativo }) {
    const primeira = data.empresas.length === 0;
    const emp = { id: U.uid(), cnpj: U.onlyDigits(cnpj), razaoSocial, ativo: !!ativo, criadoEm: new Date().toISOString() };
    data.empresas.push(emp);
    save();
    // Dados da escala usados antes de existir login passam para a primeira empresa cadastrada.
    const herdou = primeira && App.store.adoptLegacy(emp.id);
    return { empresa: emp, herdouDados: herdou };
  }

  function updateEmpresa(id, patch) {
    const emp = getEmpresa(id);
    if (!emp) return;
    if (patch.cnpj !== undefined) patch = Object.assign({}, patch, { cnpj: U.onlyDigits(patch.cnpj) });
    Object.assign(emp, patch);
    save();
  }

  function removeEmpresa(id) {
    data.empresas = data.empresas.filter((e) => e.id !== id);
    save();
    App.store.removeData(id);
  }

  // ---------- Usuários ----------
  function usuarios() {
    return data.usuarios.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(publico);
  }

  function getUsuario(id) {
    return publico(data.usuarios.find((u) => u.id === id));
  }

  function findUsuarioByEmail(email) {
    return publico(data.usuarios.find((u) => u.email === normEmail(email)));
  }

  function usuariosDaEmpresa(empresaId) {
    return data.usuarios.filter((u) => u.empresaId === empresaId).length;
  }

  function mastersAtivos() {
    return data.usuarios.filter((u) => u.papel === 'master' && u.ativo).length;
  }

  function addUsuario({ nome, email, senha, papel, empresaId, ativo }) {
    const salt = randomSalt();
    const u = {
      id: U.uid(), nome, email: normEmail(email), papel,
      empresaId: papel === 'master' ? null : empresaId,
      ativo: ativo !== false, salt, senhaHash: hashSenha(senha, salt),
      criadoEm: new Date().toISOString()
    };
    data.usuarios.push(u);
    save();
    return publico(u);
  }

  // `senha` só é trocada quando vier preenchida.
  function updateUsuario(id, patch) {
    const u = data.usuarios.find((x) => x.id === id);
    if (!u) return;
    const { senha, ...resto } = patch;
    if (u.fixo) { delete resto.papel; delete resto.ativo; delete resto.empresaId; }
    Object.assign(u, resto);
    if (resto.email !== undefined) u.email = normEmail(resto.email);
    if (u.papel === 'master') u.empresaId = null;
    if (senha) {
      u.salt = randomSalt();
      u.senhaHash = hashSenha(senha, u.salt);
    }
    save();
  }

  function removeUsuario(id) {
    data.usuarios = data.usuarios.filter((u) => u.id !== id || u.fixo);
    save();
  }

  // ---------- Sessão ----------
  function startSession(userId) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ usuarioId: userId, inicio: new Date().toISOString() })); } catch (e) { /* sem armazenamento */ }
  }

  // Motivo que impede o usuário de entrar agora, ou null.
  function bloqueio(u) {
    if (!u.ativo) return 'Este usuário está com o acesso inativo. Fale com o gerente da empresa ou com o master da plataforma.';
    if (u.papel !== 'master') {
      const emp = getEmpresa(u.empresaId);
      if (!emp) return 'A empresa deste usuário não existe mais. Fale com o master da plataforma.';
      if (!emp.ativo) return `O acesso da empresa ${emp.razaoSocial} está inativo. Fale com o master da plataforma.`;
    }
    return null;
  }

  // Retorna { usuario } ou { erro }.
  function login(email, senha) {
    const u = data.usuarios.find((x) => x.email === normEmail(email));
    if (!u || hashSenha(senha, u.salt) !== u.senhaHash) return { erro: 'E-mail ou senha incorretos.' };
    const motivo = bloqueio(u);
    if (motivo) return { erro: motivo };
    startSession(u.id);
    return { usuario: publico(u) };
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* sem armazenamento */ }
  }

  let ultimoBloqueio = null;

  // Usuário da sessão, se ainda puder entrar (usuário e empresa ativos). Senão encerra a sessão.
  function currentUser() {
    data = load(); // outra aba pode ter mudado usuários ou empresas
    let sessao = null;
    try { sessao = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { sessao = null; }
    if (!sessao) return null;
    const u = data.usuarios.find((x) => x.id === sessao.usuarioId);
    const motivo = u ? bloqueio(u) : 'Sua sessão terminou. Entre novamente.';
    if (motivo) {
      ultimoBloqueio = motivo;
      logout();
      return null;
    }
    return publico(u);
  }

  // Mensagem de por que a última sessão foi encerrada (lida uma vez, pela tela de login).
  function takeBloqueio() {
    const m = ultimoBloqueio;
    ultimoBloqueio = null;
    return m;
  }

  function changeOwnPassword(atual, nova) {
    const me = currentUser();
    const u = me && data.usuarios.find((x) => x.id === me.id);
    if (!u) return 'Sua sessão terminou. Entre novamente.';
    if (hashSenha(atual, u.salt) !== u.senhaHash) return 'A senha atual está incorreta.';
    const err = validarSenha(nova);
    if (err) return err;
    updateUsuario(u.id, { senha: nova });
    return null;
  }

  function canAccess(user, route) {
    return !!user && (ROTAS[user.papel] || []).includes(route);
  }

  function homeRoute(user) {
    return (ROTAS[user.papel] || ['escala'])[0];
  }

  App.auth = {
    PAPEIS, ROTAS, SENHA_MIN,
    login, logout, currentUser, takeBloqueio, changeOwnPassword,
    canAccess, homeRoute, validarSenha, isValidEmail, normEmail,
    empresas, getEmpresa, findEmpresaByCNPJ, addEmpresa, updateEmpresa, removeEmpresa,
    usuarios, getUsuario, findUsuarioByEmail, usuariosDaEmpresa, mastersAtivos,
    addUsuario, updateUsuario, removeUsuario,
    _sha256: (s) => toHex(sha256(utf8(s)))
  };
})(window.App);
