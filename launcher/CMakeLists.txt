cmake_minimum_required(VERSION 3.16)
project(GNLauncher C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Expect SDL2, SDL2_ttf, SQLite3 available on system.
# On Windows you can use vcpkg: sdl2 sdl2-ttf sqlite3
find_package(SDL2 REQUIRED)
find_package(SDL2_ttf REQUIRED)
find_package(SQLite3 REQUIRED)

add_executable(GNLauncher
  main.c
  gn_ini.c
  gn_log.c
  gn_session.c
  gn_menu.c
  gn_audio.c
  gn_ui.c
)

target_include_directories(GNLauncher PRIVATE
  ${SDL2_INCLUDE_DIRS}
  ${SDL2_TTF_INCLUDE_DIRS}
  ${SQLite3_INCLUDE_DIRS}
  .
)

target_link_libraries(GNLauncher PRIVATE
  ${SDL2_LIBRARIES}
  SQLite::SQLite3
)

if (TARGET SDL2::SDL2)
  target_link_libraries(GNLauncher PRIVATE SDL2::SDL2)
endif()
if (TARGET SDL2::SDL2main)
  target_link_libraries(GNLauncher PRIVATE SDL2::SDL2main)
endif()
if (TARGET SDL2_ttf::SDL2_ttf)
  target_link_libraries(GNLauncher PRIVATE SDL2_ttf::SDL2_ttf)
else()
  target_link_libraries(GNLauncher PRIVATE ${SDL2_TTF_LIBRARIES})
endif()

# Copy default ini next to binary (build dir)
add_custom_command(TARGET GNLauncher POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_if_different
    ${CMAKE_CURRENT_SOURCE_DIR}/launcher.ini
    $<TARGET_FILE_DIR:GNLauncher>/launcher.ini
)

# Copy font asset if present
add_custom_command(TARGET GNLauncher POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E make_directory
    $<TARGET_FILE_DIR:GNLauncher>/assets
)
add_custom_command(TARGET GNLauncher POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_if_different
    ${CMAKE_CURRENT_SOURCE_DIR}/assets/DejaVuSansMono.ttf
    $<TARGET_FILE_DIR:GNLauncher>/assets/DejaVuSansMono.ttf
)
