/* Leitura e geração de CSV (compatível com Excel em português: separador ";"). */
(function (App) {
  const U = App.util;

  // Decodifica o arquivo tentando UTF-8; se falhar, usa Windows-1252 (padrão do Excel no Brasil).
  function decode(buffer) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
    } catch (e) {
      return new TextDecoder('windows-1252').decode(buffer);
    }
  }

  function detectDelimiter(text) {
    const first = text.split(/\r?\n/)[0] || '';
    const counts = [';', ',', '\t'].map((d) => [d, first.split(d).length]);
    counts.sort((a, b) => b[1] - a[1]);
    return counts[0][0];
  }

  function parse(text) {
    const delim = detectDelimiter(text);
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ''));
  }

  function toCSV(rows) {
    return '﻿' + rows.map((r) => r.map((v) => {
      const s = String(v == null ? '' : v);
      return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\r\n');
  }

  // Mapeia nomes de colunas aceitos para os campos do cadastro.
  const HEADERS = {
    nome: ['nome', 'nome completo', 'nome_completo', 'funcionario', 'empregado'],
    cpf: ['cpf'],
    sexo: ['sexo', 'genero'],
    nascimento: ['data de nascimento', 'data_nascimento', 'nascimento', 'data nascimento', 'dt nascimento', 'dt_nascimento'],
    departamento: ['departamento', 'depto', 'setor', 'secao'],
    cargo: ['cargo', 'funcao']
  };

  function parseSexo(v) {
    const s = U.normalize(v);
    if (['m', 'masc', 'masculino', 'homem'].includes(s)) return 'M';
    if (['f', 'fem', 'feminino', 'mulher'].includes(s)) return 'F';
    return null;
  }

  // Converte as linhas do CSV em funcionários. Retorna { ok: [...], errors: [{linha, motivo}] }.
  function toEmployees(rows) {
    if (!rows.length) return { ok: [], errors: [{ linha: 1, motivo: 'Arquivo vazio.' }] };
    const header = rows[0].map(U.normalize);
    const idx = {};
    Object.keys(HEADERS).forEach((field) => {
      idx[field] = header.findIndex((h) => HEADERS[field].includes(h));
    });
    const missing = Object.keys(idx).filter((f) => idx[f] < 0);
    if (missing.length) {
      return {
        ok: [],
        errors: [{ linha: 1, motivo: 'Colunas não encontradas no cabeçalho: ' + missing.join(', ') + '. Use o modelo de CSV.' }]
      };
    }

    const ok = [], errors = [];
    const seen = new Set();
    rows.slice(1).forEach((r, i) => {
      const linha = i + 2;
      const get = (f) => (r[idx[f]] || '').trim();
      const nome = get('nome').replace(/\s+/g, ' ');
      const cpf = U.onlyDigits(get('cpf')).padStart(11, '0');
      const sexo = parseSexo(get('sexo'));
      const nascimento = U.parseDateFlexible(get('nascimento'));
      const cargo = get('cargo');
      const departamento = get('departamento').replace(/\s+/g, ' ');
      const problems = [];
      if (nome.length < 3) problems.push('nome inválido');
      if (!U.isValidCPF(cpf)) problems.push('CPF inválido');
      else if (App.store.findByCPF(cpf)) problems.push('CPF já cadastrado');
      else if (seen.has(cpf)) problems.push('CPF repetido no arquivo');
      if (!sexo) problems.push('sexo deve ser M ou F');
      if (!nascimento) problems.push('data de nascimento inválida');
      if (!departamento) problems.push('departamento vazio');
      if (!cargo) problems.push('cargo vazio');
      if (problems.length) {
        errors.push({ linha, nome, motivo: problems.join(', ') });
      } else {
        seen.add(cpf);
        ok.push({ nome, cpf, sexo, nascimento, departamento, cargo });
      }
    });
    return { ok, errors };
  }

  function template() {
    return toCSV([
      ['nome completo', 'cpf', 'sexo', 'data de nascimento', 'departamento', 'cargo'],
      ['Maria da Silva Souza', '529.982.247-25', 'F', '15/03/1990', 'Frente de caixa', 'Operadora de Caixa'],
      ['João Pereira Santos', '111.444.777-35', 'M', '02/11/1985', 'Mercearia', 'Repositor']
    ]);
  }

  App.csv = { decode, parse, toCSV, toEmployees, template };
})(window.App);
