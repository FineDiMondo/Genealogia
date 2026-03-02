cmake_minimum_required(VERSION 3.16)
project(ScummLikeEngine C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

find_package(SDL2 REQUIRED)

add_executable(scummlike main.c)
target_link_libraries(scummlike PRIVATE SDL2::SDL2 SDL2::SDL2main)

set_target_properties(scummlike PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/engine_scummlike/bin
)
