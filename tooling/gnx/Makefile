CC ?= cc
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -pedantic
OUT ?= ../../build/gnx/gnx
SRC = src/gnx.c

all: $(OUT)

$(OUT): $(SRC)
	@mkdir -p $(dir $(OUT))
	$(CC) $(CFLAGS) -o $@ $^

clean:
	rm -f $(OUT)

.PHONY: all clean
