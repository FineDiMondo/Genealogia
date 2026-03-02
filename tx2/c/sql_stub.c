#include <ctype.h>
#include <stddef.h>

void SQL_STUB(char *in_tipo_operazione, int *out_num_righe, int *out_cod_esito) {
    size_t i;
    int valorizzato = 0;

    if (!in_tipo_operazione || !out_num_righe || !out_cod_esito) {
        return;
    }

    for (i = 0; in_tipo_operazione[i] != '\0'; ++i) {
        if (!isspace((unsigned char)in_tipo_operazione[i])) {
            valorizzato = 1;
            break;
        }
    }

    if (valorizzato) {
        *out_num_righe = 3;
        *out_cod_esito = 0;
    } else {
        *out_num_righe = 0;
        *out_cod_esito = 12;
    }
}
