export interface PreBuildPC {
    id: string;
    titulo: string;
    categoria: 'Entrada' | 'Intermediário'| 'Avançado' | 'Especialista';
    descricao: string;
    precoTotal: number;
    imagemUrl: string;
    especificacoes: {
        processador: string;
        placaMae: string;
        ram: string;
        gpu?: string;
        armazenamento: string;
        fonte: string;
        gabinete: string;
        cooler?: string;
    };
}