#include <ctype.h>
#include <stddef.h>

void LLM_STUB(char *in_testo_richiesta, int *out_num_risultati, int *out_cod_esito) {
    size_t i;
    int valorizzato = 0;

    if (!in_testo_richiesta || !out_num_risultati || !out_cod_esito) {
        return;
    }

    for (i = 0; in_testo_richiesta[i] != '\0'; ++i) {
        if (!isspace((unsigned char)in_testo_richiesta[i])) {
            valorizzato = 1;
            break;
        }
    }

    if (valorizzato) {
        *out_num_risultati = 2;
        *out_cod_esito = 0;
    } else {
        *out_num_risultati = 0;
        *out_cod_esito = 12;
    }
}
